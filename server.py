"""
OSRS Wiki MCP Server
Provides Claude Code with real-time access to the Old School RuneScape Wiki.
"""

import urllib.parse
import json
import re
import httpx
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("osrs-wiki", instructions="""
You have access to the Old School RuneScape (OSRS) Wiki through this MCP server.
Use these tools to look up accurate, up-to-date game information including items,
monsters, quests, skills, bosses, and more. Always prefer wiki lookups over
relying on your training data for OSRS-specific facts.
""")

API_URL = "https://oldschool.runescape.wiki/api.php"
USER_AGENT = "OSRS-Wiki-MCP/1.0 (Claude Code MCP Server)"
HEADERS = {"User-Agent": USER_AGENT, "Accept": "application/json"}


async def wiki_request(params: dict) -> dict:
    """Make a request to the OSRS Wiki API."""
    params["format"] = "json"
    async with httpx.AsyncClient(headers=HEADERS, timeout=30.0) as client:
        resp = await client.get(API_URL, params=params)
        resp.raise_for_status()
        return resp.json()


def clean_wikitext(text: str) -> str:
    """Remove common wikitext markup for cleaner output."""
    # Remove file/image links
    text = re.sub(r'\[\[File:[^\]]*\]\]', '', text)
    text = re.sub(r'\[\[Image:[^\]]*\]\]', '', text)
    # Convert [[Link|Display]] to Display
    text = re.sub(r'\[\[[^\]|]*\|([^\]]*)\]\]', r'\1', text)
    # Convert [[Link]] to Link
    text = re.sub(r'\[\[([^\]]*)\]\]', r'\1', text)
    # Remove templates like {{something}}  (simple ones)
    text = re.sub(r'\{\{[Cc]ite[^}]*\}\}', '', text)
    # Remove HTML comments
    text = re.sub(r'<!--.*?-->', '', text, flags=re.DOTALL)
    # Remove <ref> tags
    text = re.sub(r'<ref[^>]*>.*?</ref>', '', text, flags=re.DOTALL)
    text = re.sub(r'<ref[^/]*/>', '', text)
    # Clean up extra whitespace
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()


@mcp.tool()
async def search_wiki(query: str, limit: int = 10) -> str:
    """Search the OSRS Wiki for pages matching a query.

    Use this to find pages about items, monsters, quests, skills, locations,
    or any other OSRS topic. Returns page titles and snippets.

    Args:
        query: Search terms (e.g. "dragon scimitar", "Zulrah", "Recipe for Disaster")
        limit: Max results to return (1-20, default 10)
    """
    limit = max(1, min(20, limit))
    data = await wiki_request({
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srlimit": limit,
        "srprop": "snippet|titlesnippet|wordcount",
    })

    results = data.get("query", {}).get("search", [])
    if not results:
        return f"No results found for '{query}'."

    lines = [f"## Search results for '{query}' ({len(results)} results)\n"]
    for r in results:
        snippet = re.sub(r'<[^>]+>', '', r.get("snippet", ""))
        lines.append(f"- **{r['title']}** ({r.get('wordcount', '?')} words)")
        if snippet:
            lines.append(f"  {snippet[:200]}")
    return "\n".join(lines)


@mcp.tool()
async def get_page(title: str, section: int | None = None) -> str:
    """Get the full content of an OSRS Wiki page.

    Retrieves the parsed text content of a wiki page. Use search_wiki first
    if you're not sure of the exact page title.

    Args:
        title: Exact page title (e.g. "Abyssal whip", "Zulrah/Strategies")
        section: Optional section index to retrieve only that section
    """
    params = {
        "action": "parse",
        "page": title,
        "prop": "wikitext",
        "disabletoc": "true",
    }
    if section is not None:
        params["section"] = section

    try:
        data = await wiki_request(params)
    except httpx.HTTPStatusError:
        return f"Page '{title}' not found."

    if "error" in data:
        return f"Error: {data['error'].get('info', 'Unknown error')}"

    wikitext = data.get("parse", {}).get("wikitext", {}).get("*", "")
    if not wikitext:
        return f"Page '{title}' has no content."

    cleaned = clean_wikitext(wikitext)
    # Truncate very long pages
    if len(cleaned) > 12000:
        cleaned = cleaned[:12000] + "\n\n... [Content truncated. Use get_page_section to read specific sections.]"

    page_url = f"https://oldschool.runescape.wiki/w/{urllib.parse.quote(title.replace(' ', '_'))}"
    return f"## {title}\nSource: {page_url}\n\n{cleaned}"


@mcp.tool()
async def get_page_extract(title: str) -> str:
    """Get a clean plain-text summary/extract of an OSRS Wiki page.

    Returns the introductory section of a page as clean plain text.
    Best for quick lookups when you just need the overview.

    Args:
        title: Exact page title (e.g. "Bandos godsword", "Tempoross")
    """
    data = await wiki_request({
        "action": "query",
        "titles": title,
        "prop": "extracts",
        "explaintext": "true",
        "exintro": "true",
    })

    pages = data.get("query", {}).get("pages", {})
    for page_id, page in pages.items():
        if page_id == "-1":
            return f"Page '{title}' not found."
        extract = page.get("extract", "")
        if not extract:
            return f"Page '{title}' exists but has no extract."
        page_url = f"https://oldschool.runescape.wiki/w/{urllib.parse.quote(title.replace(' ', '_'))}"
        return f"## {page.get('title', title)}\nSource: {page_url}\n\n{extract}"

    return f"Page '{title}' not found."


@mcp.tool()
async def get_page_sections(title: str) -> str:
    """List all sections of an OSRS Wiki page.

    Useful for finding what sections exist on a page before retrieving
    specific ones with get_page(title, section=N).

    Args:
        title: Exact page title
    """
    data = await wiki_request({
        "action": "parse",
        "page": title,
        "prop": "sections",
    })

    if "error" in data:
        return f"Error: {data['error'].get('info', 'Unknown error')}"

    sections = data.get("parse", {}).get("sections", [])
    if not sections:
        return f"Page '{title}' has no sections (or doesn't exist)."

    lines = [f"## Sections of '{title}'\n"]
    for s in sections:
        indent = "  " * (int(s.get("toclevel", 1)) - 1)
        lines.append(f"{indent}- [{s['index']}] {s['line']}")
    return "\n".join(lines)


@mcp.tool()
async def get_page_section(title: str, section: int) -> str:
    """Get a specific section of an OSRS Wiki page by section index.

    Use get_page_sections first to see available sections and their indices.

    Args:
        title: Exact page title
        section: Section index number from get_page_sections
    """
    return await get_page(title, section=section)


@mcp.tool()
async def get_page_categories(title: str) -> str:
    """Get the categories a page belongs to.

    Useful for understanding what type of content a page represents
    (e.g. is it a quest, an item, a monster, etc).

    Args:
        title: Exact page title
    """
    data = await wiki_request({
        "action": "query",
        "titles": title,
        "prop": "categories",
        "cllimit": "50",
    })

    pages = data.get("query", {}).get("pages", {})
    for page_id, page in pages.items():
        if page_id == "-1":
            return f"Page '{title}' not found."
        cats = page.get("categories", [])
        if not cats:
            return f"Page '{title}' has no categories."
        lines = [f"## Categories for '{title}'\n"]
        for c in cats:
            cat_name = c.get("title", "").replace("Category:", "")
            lines.append(f"- {cat_name}")
        return "\n".join(lines)

    return f"Page '{title}' not found."


@mcp.tool()
async def get_category_members(category: str, limit: int = 25) -> str:
    """List pages in a specific wiki category.

    Useful for browsing items, quests, monsters, etc. by category.
    Category names should not include the "Category:" prefix.

    Args:
        category: Category name (e.g. "Slayer monsters", "Free-to-play quests")
        limit: Max results (1-50, default 25)
    """
    limit = max(1, min(50, limit))
    data = await wiki_request({
        "action": "query",
        "list": "categorymembers",
        "cmtitle": f"Category:{category}",
        "cmlimit": limit,
        "cmprop": "title|type",
    })

    members = data.get("query", {}).get("categorymembers", [])
    if not members:
        return f"No pages found in category '{category}' (it may not exist)."

    lines = [f"## Pages in category '{category}' ({len(members)} shown)\n"]
    for m in members:
        type_label = f" [{m['type']}]" if m.get("type") == "subcat" else ""
        lines.append(f"- {m['title']}{type_label}")
    return "\n".join(lines)


@mcp.tool()
async def get_exchange_price(item: str) -> str:
    """Get the Grand Exchange price for an item.

    Looks up current GE pricing data from the OSRS Wiki's realtime prices API.

    Args:
        item: Item name to look up (e.g. "Abyssal whip", "Dragon bones")
    """
    # First, search for the item to get its page and confirm it exists
    search_data = await wiki_request({
        "action": "query",
        "list": "search",
        "srsearch": item,
        "srnamespace": "0",
        "srlimit": "5",
    })

    results = search_data.get("query", {}).get("search", [])
    if not results:
        return f"Could not find item '{item}' on the wiki."

    # Try to get exchange data from the wiki page
    best_title = results[0]["title"]

    # Get the exchange page content which has price info
    exchange_title = f"Module:Exchange/{best_title}"
    params = {
        "action": "parse",
        "page": exchange_title,
        "prop": "wikitext",
    }

    try:
        data = await wiki_request(params)
        wikitext = data.get("parse", {}).get("wikitext", {}).get("*", "")
        if wikitext:
            # Parse out the price, item ID, etc.
            info = {}
            for line in wikitext.split("\n"):
                line = line.strip()
                if "=" in line and not line.startswith("--"):
                    parts = line.split("=", 1)
                    key = parts[0].strip().strip("[]'\" ")
                    val = parts[1].strip().rstrip(",").strip("'\" ")
                    if key and val:
                        info[key] = val

            lines = [f"## Grand Exchange: {best_title}\n"]
            if "itemId" in info:
                lines.append(f"- **Item ID:** {info['itemId']}")
            if "price" in info:
                lines.append(f"- **Price:** {int(info['price']):,} gp")
            if "last" in info:
                lines.append(f"- **Last updated:** {info['last']}")
            if "volume" in info:
                lines.append(f"- **Daily volume:** {int(info['volume']):,}")
            if "limit" in info:
                lines.append(f"- **Buy limit:** {info['limit']}")

            page_url = f"https://oldschool.runescape.wiki/w/{urllib.parse.quote(best_title.replace(' ', '_'))}"
            lines.append(f"\nWiki page: {page_url}")
            return "\n".join(lines)
    except Exception:
        pass

    return f"Could not find Grand Exchange data for '{item}'. It may not be tradeable. Closest wiki page: {best_title}"


@mcp.tool()
async def get_item_info(item_name: str) -> str:
    """Get detailed info about an OSRS item from its infobox.

    Retrieves the item's stats, properties, and metadata from the wiki.
    Covers weapons, armour, food, potions, resources, and more.

    Args:
        item_name: Item name (e.g. "Toxic blowpipe", "Saradomin godsword")
    """
    data = await wiki_request({
        "action": "parse",
        "page": item_name,
        "prop": "wikitext",
        "section": 0,
    })

    if "error" in data:
        # Try searching
        return f"Page '{item_name}' not found. Try search_wiki to find the correct name."

    wikitext = data.get("parse", {}).get("wikitext", {}).get("*", "")
    if not wikitext:
        return f"No content found for '{item_name}'."

    # Extract infobox data
    infobox_match = re.search(r'\{\{[Ii]nfobox [Ii]tem(.*?)\n\}\}', wikitext, re.DOTALL)
    if not infobox_match:
        infobox_match = re.search(r'\{\{[Ii]nfobox [Bb]onuses(.*?)\n\}\}', wikitext, re.DOTALL)

    lines = [f"## Item: {item_name}\n"]

    if infobox_match:
        infobox_text = infobox_match.group(1)
        for line in infobox_text.split("\n"):
            line = line.strip()
            if line.startswith("|") and "=" in line:
                parts = line[1:].split("=", 1)
                key = parts[0].strip()
                val = parts[1].strip()
                val = re.sub(r'\[\[([^\]|]*\|)?([^\]]*)\]\]', r'\2', val)
                val = re.sub(r'\{\{[^}]*\}\}', '', val).strip()
                if val and key and not key.startswith("version"):
                    lines.append(f"- **{key}:** {val}")
    else:
        lines.append("(No infobox found - showing page intro)")

    # Add cleaned intro text
    intro = clean_wikitext(wikitext.split("\n\n")[0] if "\n\n" in wikitext else wikitext[:500])
    intro = re.sub(r'\{\{[^}]*\}\}', '', intro).strip()
    if intro:
        lines.append(f"\n{intro}")

    page_url = f"https://oldschool.runescape.wiki/w/{urllib.parse.quote(item_name.replace(' ', '_'))}"
    lines.append(f"\nSource: {page_url}")
    return "\n".join(lines)


@mcp.tool()
async def get_monster_info(monster_name: str) -> str:
    """Get detailed info about an OSRS monster/NPC.

    Retrieves combat stats, drops, and other info from the wiki.

    Args:
        monster_name: Monster name (e.g. "Vorkath", "Abyssal demon", "TzTok-Jad")
    """
    data = await wiki_request({
        "action": "parse",
        "page": monster_name,
        "prop": "wikitext",
        "section": 0,
    })

    if "error" in data:
        return f"Page '{monster_name}' not found. Try search_wiki to find the correct name."

    wikitext = data.get("parse", {}).get("wikitext", {}).get("*", "")
    if not wikitext:
        return f"No content found for '{monster_name}'."

    # Extract infobox
    infobox_match = re.search(r'\{\{[Ii]nfobox [Mm]onster(.*?)\n\}\}', wikitext, re.DOTALL)

    lines = [f"## Monster: {monster_name}\n"]

    if infobox_match:
        infobox_text = infobox_match.group(1)
        for line in infobox_text.split("\n"):
            line = line.strip()
            if line.startswith("|") and "=" in line:
                parts = line[1:].split("=", 1)
                key = parts[0].strip()
                val = parts[1].strip()
                val = re.sub(r'\[\[([^\]|]*\|)?([^\]]*)\]\]', r'\2', val)
                val = re.sub(r'\{\{[^}]*\}\}', '', val).strip()
                if val and key and not key.startswith("version"):
                    lines.append(f"- **{key}:** {val}")

    intro = clean_wikitext(wikitext.split("\n\n")[0] if "\n\n" in wikitext else wikitext[:500])
    intro = re.sub(r'\{\{[^}]*\}\}', '', intro).strip()
    if intro:
        lines.append(f"\n{intro}")

    page_url = f"https://oldschool.runescape.wiki/w/{urllib.parse.quote(monster_name.replace(' ', '_'))}"
    lines.append(f"\nSource: {page_url}")
    return "\n".join(lines)


@mcp.tool()
async def get_quest_info(quest_name: str) -> str:
    """Get info about an OSRS quest.

    Retrieves quest requirements, rewards, and overview from the wiki.

    Args:
        quest_name: Quest name (e.g. "Dragon Slayer II", "Song of the Elves")
    """
    data = await wiki_request({
        "action": "parse",
        "page": quest_name,
        "prop": "wikitext",
        "section": 0,
    })

    if "error" in data:
        return f"Quest '{quest_name}' not found. Try search_wiki to find the correct name."

    wikitext = data.get("parse", {}).get("wikitext", {}).get("*", "")
    if not wikitext:
        return f"No content found for '{quest_name}'."

    infobox_match = re.search(r'\{\{[Ii]nfobox [Qq]uest(.*?)\n\}\}', wikitext, re.DOTALL)

    lines = [f"## Quest: {quest_name}\n"]

    if infobox_match:
        infobox_text = infobox_match.group(1)
        for line in infobox_text.split("\n"):
            line = line.strip()
            if line.startswith("|") and "=" in line:
                parts = line[1:].split("=", 1)
                key = parts[0].strip()
                val = parts[1].strip()
                val = re.sub(r'\[\[([^\]|]*\|)?([^\]]*)\]\]', r'\2', val)
                val = re.sub(r'\{\{[^}]*\}\}', '', val).strip()
                if val and key:
                    lines.append(f"- **{key}:** {val}")

    intro = clean_wikitext(wikitext.split("\n\n")[0] if "\n\n" in wikitext else wikitext[:500])
    intro = re.sub(r'\{\{[^}]*\}\}', '', intro).strip()
    if intro:
        lines.append(f"\n{intro}")

    page_url = f"https://oldschool.runescape.wiki/w/{urllib.parse.quote(quest_name.replace(' ', '_'))}"
    lines.append(f"\nSource: {page_url}")
    return "\n".join(lines)


@mcp.tool()
async def compare_items(item1: str, item2: str) -> str:
    """Compare two OSRS items side by side.

    Fetches infobox data for both items and presents them together for comparison.
    Great for comparing weapons, armour, etc.

    Args:
        item1: First item name
        item2: Second item name
    """
    async def get_infobox(name: str) -> dict:
        data = await wiki_request({
            "action": "parse",
            "page": name,
            "prop": "wikitext",
            "section": 0,
        })
        if "error" in data:
            return {"_error": f"Page '{name}' not found"}
        wikitext = data.get("parse", {}).get("wikitext", {}).get("*", "")
        infobox_match = re.search(r'\{\{[Ii]nfobox [^\n]*(.*?)\n\}\}', wikitext, re.DOTALL)
        info = {}
        if infobox_match:
            for line in infobox_match.group(1).split("\n"):
                line = line.strip()
                if line.startswith("|") and "=" in line:
                    parts = line[1:].split("=", 1)
                    key = parts[0].strip()
                    val = parts[1].strip()
                    val = re.sub(r'\[\[([^\]|]*\|)?([^\]]*)\]\]', r'\2', val)
                    val = re.sub(r'\{\{[^}]*\}\}', '', val).strip()
                    if val and key:
                        info[key] = val
        return info

    info1 = await get_infobox(item1)
    info2 = await get_infobox(item2)

    if "_error" in info1:
        return info1["_error"]
    if "_error" in info2:
        return info2["_error"]

    all_keys = list(dict.fromkeys(list(info1.keys()) + list(info2.keys())))

    lines = [f"## Comparison: {item1} vs {item2}\n"]
    lines.append(f"| Stat | {item1} | {item2} |")
    lines.append(f"|------|---------|---------|")
    for key in all_keys:
        if key.startswith("version"):
            continue
        v1 = info1.get(key, "-")
        v2 = info2.get(key, "-")
        lines.append(f"| {key} | {v1} | {v2} |")
    return "\n".join(lines)


@mcp.tool()
async def get_skill_info(skill_name: str) -> str:
    """Get info about an OSRS skill.

    Retrieves overview information about a skill including training methods.

    Args:
        skill_name: Skill name (e.g. "Slayer", "Construction", "Runecraft")
    """
    return await get_page_extract(skill_name)


@mcp.tool()
async def lookup_drop_table(monster_name: str) -> str:
    """Get the drop table for a monster.

    Retrieves the drops section from a monster's wiki page, including
    drop rates and item names.

    Args:
        monster_name: Monster name (e.g. "Vorkath", "Zulrah", "Demonic gorilla")
    """
    # First get the sections to find the drops section
    sections_data = await wiki_request({
        "action": "parse",
        "page": monster_name,
        "prop": "sections",
    })

    if "error" in sections_data:
        return f"Page '{monster_name}' not found."

    sections = sections_data.get("parse", {}).get("sections", [])
    drop_sections = [s for s in sections if "drop" in s.get("line", "").lower()]

    if not drop_sections:
        return f"No drops section found for '{monster_name}'."

    # Get the first drops section and a few after it
    start_idx = int(drop_sections[0]["index"])

    lines = [f"## Drop table: {monster_name}\n"]

    # Fetch several consecutive sections that are drop-related
    for s in sections:
        idx = int(s["index"])
        if idx >= start_idx and (idx <= start_idx + 15):
            section_data = await wiki_request({
                "action": "parse",
                "page": monster_name,
                "prop": "wikitext",
                "section": idx,
            })
            wikitext = section_data.get("parse", {}).get("wikitext", {}).get("*", "")
            if wikitext:
                level = int(s.get("toclevel", 1))
                header = "#" * (level + 1)
                lines.append(f"{header} {s['line']}")
                cleaned = clean_wikitext(wikitext)
                # Remove section headers from the cleaned text since we add our own
                cleaned = re.sub(r'^=+.*?=+\s*$', '', cleaned, flags=re.MULTILINE).strip()
                if cleaned:
                    lines.append(cleaned)
                lines.append("")

    result = "\n".join(lines)
    if len(result) > 12000:
        result = result[:12000] + "\n\n... [Truncated. Use get_page_section for specific sections.]"

    page_url = f"https://oldschool.runescape.wiki/w/{urllib.parse.quote(monster_name.replace(' ', '_'))}"
    result += f"\n\nSource: {page_url}"
    return result


if __name__ == "__main__":
    mcp.run(transport="stdio")
