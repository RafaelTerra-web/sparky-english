from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUTFITS = ROOT / "public" / "visuals" / "wardrobe" / "outfits"
ACCESSORIES = ROOT / "public" / "visuals" / "wardrobe" / "accessories"
OUTPUT = ROOT / "docs"
BACK_ITEMS = {"explorer-satchel", "compact-backpack", "book-tote", "rocket-pack"}


def build(mascot: str) -> None:
    outfits = [ROOT / "public" / "visuals" / "wardrobe" / "bases" / f"{mascot}.png", *sorted(OUTFITS.glob(f"{mascot}-*.png"))]
    accessories = sorted(ACCESSORIES.glob(f"*-{mascot}.png"))
    cell, caption = 180, 28
    sheet = Image.new("RGB", (cell * len(outfits), (cell + caption) * (len(accessories) + 1)), "#eaf2ef")
    draw = ImageDraw.Draw(sheet)

    for column, outfit_path in enumerate(outfits):
        label = outfit_path.stem.removeprefix(f"{mascot}-")
        outfit = Image.open(outfit_path).convert("RGBA").resize((cell, cell), Image.Resampling.LANCZOS)
        background = Image.new("RGBA", (cell, cell), "#eaf2efff")
        sheet.paste(Image.alpha_composite(background, outfit).convert("RGB"), (column * cell, 0))
        draw.text((column * cell + 8, cell + 5), label, fill="#10251f")

    for row, accessory_path in enumerate(accessories, start=1):
        accessory_name = accessory_path.stem.removesuffix(f"-{mascot}")
        accessory = Image.open(accessory_path).convert("RGBA")
        for column, outfit_path in enumerate(outfits):
            outfit = Image.open(outfit_path).convert("RGBA")
            if accessory_name in BACK_ITEMS:
                composite = Image.alpha_composite(accessory, outfit)
            else:
                composite = Image.alpha_composite(outfit, accessory)
            thumbnail = composite.resize((cell, cell), Image.Resampling.LANCZOS)
            background = Image.new("RGBA", (cell, cell), "#eaf2efff")
            y = row * (cell + caption)
            sheet.paste(Image.alpha_composite(background, thumbnail).convert("RGB"), (column * cell, y))
            draw.text((column * cell + 8, y + cell + 5), accessory_name, fill="#10251f")

    destination = OUTPUT / f"wardrobe-contact-{mascot}.webp"
    sheet.save(destination, "WEBP", quality=84, method=6)
    print(f"Wrote {destination.relative_to(ROOT)}")


for mascot_id in ("sparky", "pinky"):
    build(mascot_id)


COMBINATIONS = {
    "sparky": [
        ("academy-look", "compact-backpack", "debate-bow", "amber-readers"),
        ("cozy-reader", "book-tote", "study-scarf", "round-readers", "knit-beanie"),
        ("science-club", "rocket-pack", "club-lanyard", "science-visor"),
        ("debate-captain", "explorer-satchel", "debate-bow", "amber-readers"),
        ("urban-sport", "compact-backpack", "constellation-pendant", "sunglasses", "urban-cap"),
    ],
    "pinky": [
        ("atelier-look", "book-tote", "constellation-pendant", "amber-readers", "lavender-beret"),
        ("campus", "compact-backpack", "debate-bow", "round-readers"),
        ("creative-lab", "rocket-pack", "club-lanyard", "science-visor"),
        ("festival", "explorer-satchel", "study-scarf", "sunglasses", "focus-headphones"),
        ("presenter", "book-tote", "constellation-pendant", "amber-readers", "urban-cap"),
    ],
}


def build_combination_matrix() -> None:
    cell, caption = 260, 34
    sheet = Image.new("RGB", (cell * 5, (cell + caption) * 2), "#eaf2ef")
    draw = ImageDraw.Draw(sheet)
    for row, mascot in enumerate(("sparky", "pinky")):
        for column, combination in enumerate(COMBINATIONS[mascot]):
            outfit_name, *accessory_names = combination
            layers = [Image.open(ACCESSORIES / f"{name}-{mascot}.png").convert("RGBA") for name in accessory_names]
            outfit = Image.open(OUTFITS / f"{mascot}-{outfit_name}.png").convert("RGBA")
            canvas = Image.new("RGBA", (640, 640), (0, 0, 0, 0))
            for name, layer in zip(accessory_names, layers):
                if name in BACK_ITEMS:
                    canvas = Image.alpha_composite(canvas, layer)
            canvas = Image.alpha_composite(canvas, outfit)
            for name, layer in zip(accessory_names, layers):
                if name not in BACK_ITEMS:
                    canvas = Image.alpha_composite(canvas, layer)
            thumbnail = canvas.resize((cell, cell), Image.Resampling.LANCZOS)
            background = Image.new("RGBA", (cell, cell), "#eaf2efff")
            x, y = column * cell, row * (cell + caption)
            sheet.paste(Image.alpha_composite(background, thumbnail).convert("RGB"), (x, y))
            draw.text((x + 8, y + cell + 6), f"{mascot} · {outfit_name}", fill="#10251f")
    destination = OUTPUT / "wardrobe-combination-matrix.webp"
    sheet.save(destination, "WEBP", quality=86, method=6)
    print(f"Wrote {destination.relative_to(ROOT)}")


build_combination_matrix()
