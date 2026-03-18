import asyncio
import aiohttp

async def main():
    locale = "nl-NL"
    url = f"https://web.getbring.com/locale/catalog.{locale}.json"

    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            data = await response.json(content_type=None)

    sections = data.get("catalog", {}).get("sections", [])
    for section in sections:
        categorie = section.get('name', 'Onbekend')
        for item in section.get('items', []):
            naam = item.get('name')
            print(f"Product: {naam} | Categorie: {categorie}")

# Run het script
if __name__ == "__main__":
    asyncio.run(main())
