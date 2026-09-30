from pathlib import Path
import json
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUTFITS = ROOT / "public" / "visuals" / "wardrobe" / "outfits"
ACCESSORIES = ROOT / "public" / "visuals" / "wardrobe" / "accessories"
OUTPUT = ROOT / "docs"
MANIFEST = json.loads((OUTPUT / "wardrobe-assets.json").read_text(encoding="utf-8"))
SLOT_ORDER = {"back": 0, "neck": 1, "face": 2, "head": 3}


def accessory_variants(mascot: str) -> dict:
    variants = {}
    for record in MANIFEST:
        if record["kind"] != "accessory" or record["mascot"] != mascot:
            continue
        name = Path(record["path"]).stem.removesuffix("-back").removesuffix(f"-{mascot}")
        variant = variants.setdefault(name, {"slot": record["slot"]})
        variant[record["layer"]] = ROOT / "public" / record["path"].lstrip("/")
    return variants


def compose_look(mascot: str, outfit_path: Path, names: list[str]) -> Image.Image:
    variants = accessory_variants(mascot)
    layers = sorted((variants[name] for name in names), key=lambda variant: SLOT_ORDER[variant["slot"]])
    canvas = Image.new("RGBA", (640, 640), (0, 0, 0, 0))
    for variant in layers:
        if variant.get("back"):
            canvas = Image.alpha_composite(canvas, Image.open(variant["back"]).convert("RGBA"))
    canvas = Image.alpha_composite(canvas, Image.open(outfit_path).convert("RGBA"))
    for variant in layers:
        if variant.get("front"):
            canvas = Image.alpha_composite(canvas, Image.open(variant["front"]).convert("RGBA"))
    return canvas


def build(mascot: str) -> None:
    outfits = [ROOT / "public" / "visuals" / "wardrobe" / "bases" / f"{mascot}.png", *sorted(OUTFITS.glob(f"{mascot}-*.png"))]
    accessories = sorted(accessory_variants(mascot))
    cell, caption = 180, 28
    sheet = Image.new("RGB", (cell * len(outfits), (cell + caption) * (len(accessories) + 1)), "#eaf2ef")
    draw = ImageDraw.Draw(sheet)

    for column, outfit_path in enumerate(outfits):
        label = outfit_path.stem.removeprefix(f"{mascot}-")
        outfit = Image.open(outfit_path).convert("RGBA").resize((cell, cell), Image.Resampling.LANCZOS)
        background = Image.new("RGBA", (cell, cell), "#eaf2efff")
        sheet.paste(Image.alpha_composite(background, outfit).convert("RGB"), (column * cell, 0))
        draw.text((column * cell + 8, cell + 5), label, fill="#10251f")

    for row, accessory_name in enumerate(accessories, start=1):
        for column, outfit_path in enumerate(outfits):
            composite = compose_look(mascot, outfit_path, [accessory_name])
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
            canvas = compose_look(mascot, OUTFITS / f"{mascot}-{outfit_name}.png", accessory_names)
            thumbnail = canvas.resize((cell, cell), Image.Resampling.LANCZOS)
            background = Image.new("RGBA", (cell, cell), "#eaf2efff")
            x, y = column * cell, row * (cell + caption)
            sheet.paste(Image.alpha_composite(background, thumbnail).convert("RGB"), (x, y))
            draw.text((x + 8, y + cell + 6), f"{mascot} · {outfit_name}", fill="#10251f")
    destination = OUTPUT / "wardrobe-combination-matrix.webp"
    sheet.save(destination, "WEBP", quality=86, method=6)
    print(f"Wrote {destination.relative_to(ROOT)}")


build_combination_matrix()
