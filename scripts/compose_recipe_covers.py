"""Photograph the workshop mesh renders on a ceramic plate with a soft studio light."""
from pathlib import Path
import json
import sys

import math
from PIL import Image, ImageDraw, ImageFilter

STYLES = {
    'cake': ((245, 232, 218), (213, 190, 168), .52),
    'pizza': ((239, 230, 212), (205, 194, 165), .77),
    'cookie': ((238, 228, 217), (204, 183, 163), .66),
}
WIDTH, HEIGHT = 1080, 780

output = Path(sys.argv[2])


def backdrop(theme):
    top, bottom, _ = STYLES[theme]
    weights = Image.new('L',(180,130))
    weights.putdata([round(255 * math.exp(-1.7*((x/180-.25)**2+(y/130-.12)**2)))
        for y in range(130) for x in range(180)])
    bg = Image.composite(Image.new('RGB',(WIDTH,HEIGHT),top), Image.new('RGB',(WIDTH,HEIGHT),bottom),
                         weights.resize((WIDTH, HEIGHT), Image.Resampling.BICUBIC))
    return bg.convert('RGBA')


def disc(picture, cx, cy, rx, ry, color):
    ImageDraw.Draw(picture).ellipse((cx-rx, cy-ry, cx+rx, cy+ry), fill=color)


def make_plate(scene, theme, cx, cy, rx, ry):
    shadow = Image.new('RGBA', scene.size)
    disc(shadow, cx+8, cy+14, rx, ry, (72, 53, 36, 92))
    scene.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(18)))
    plate = Image.new('RGBA', scene.size)
    disc(plate, cx, cy+6, rx, ry, (199, 187, 164))
    disc(plate, cx, cy, rx, ry, (243, 236, 217))
    disc(plate, cx, cy-1, rx*.984, ry*.982, (255, 250, 237))
    disc(plate, cx, cy+1, rx*.94, ry*.94, (224, 217, 198))
    disc(plate, cx, cy+1, rx*.935, ry*.935, (246, 241, 224))
    scene.alpha_composite(plate)


def compose(job):
    layers = sorted(job['layers'], key=lambda p: (p['z'], p['depth']))
    left = min(p['x'] for p in layers)
    top = min(p['y'] for p in layers)
    right = max(p['x']+p['w'] for p in layers)
    bottom = max(p['y']+p['h'] for p in layers)
    theme = job['theme']
    scale = min(WIDTH*.75/(right-left), HEIGHT*.75/(bottom-top))
    ox = WIDTH*.5 - (left+right)*scale*.5
    oy = HEIGHT*.475 - (top+bottom)*scale*.5
    width = (right-left)*scale
    rx = width*.57
    ry = rx*STYLES[theme][2]
    # The lower edge of the base and the plate share the same ground plane.
    plate_cy = bottom*scale+oy - ry*.84
    scene = backdrop(theme)
    make_plate(scene, theme, WIDTH*.5, plate_cy, rx, ry)
    for index, layer in enumerate(layers):
        piece = Image.frombytes('RGBA', (layer['w'], layer['h']), Path(layer['file']).read_bytes())
        piece = piece.resize((max(1, round(piece.width*scale)),max(1, round(piece.height*scale))), Image.Resampling.LANCZOS)
        x = round(layer['x']*scale+ox)
        y = round(layer['y']*scale+oy)
        shadow = Image.new('RGBA', scene.size)
        scaled_alpha = piece.getchannel('A').point(lambda a: round(a*(.22 if index else .32)))
        ink = Image.new('RGBA', piece.size, (67, 48, 37, 0))
        ink.putalpha(scaled_alpha)
        shadow.alpha_composite(ink, (x+3,y+(4 if index else 7)))
        scene.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(3 if index else 6)))
        scene.alpha_composite(piece, (x,y))
    scene.convert('RGB').resize((810,585),Image.Resampling.LANCZOS).save(
        output/(job['name']+'.webp'),quality=92,method=6)


for job in json.load(open(sys.argv[1])):
    compose(job)
