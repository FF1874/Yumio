# Recipe product renders

Original, procedural 3D assets made for An Kuan. Six different solid food forms match the example recipes and their materials. These are illustrative static product renders, not actual food photographs, production instructions, or rotating models.

- bear: rice biscuit with two circular ears.
- flower: five strawberry-pink petals with a milk-yellow candy center (strawberry puree 80%, milk candy 20%).
- star: dark chocolate shooting star with two rounded trails.
- berry: strawberry puree heart.
- cocoa: single dark chocolate five-point star.
- petal: six-petal rice biscuit.

900 × 675 WebP, directly encoded at quality 88. Blender 4.3.2 / Cycles CPU / 64 samples / AgX. Solid bevelled geometry, concentric extruded paths, three area lights, consistent orthographic camera. No image filters, external photos, or added garnishes. The heart uses a small rounded corner treatment to avoid cusp bevel artifacts.

Regenerate from the project root:

    blender -b -t 8 --python scripts/render_recipes.py
    python3 scripts/pack_assets.py
    python3 build.py

Rendering requires Blender; WebP packaging requires Pillow. The normal site build uses only Python's standard library and does not require Blender. PNGs and the contact sheet are ignored intermediates. The deployable assets are the six WebP files only.
