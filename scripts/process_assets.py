import os
from PIL import Image

def remove_white_bg(input_path, output_path, threshold=240):
    try:
        img = Image.open(input_path).convert("RGBA")
        datas = img.getdata()

        newData = []
        for item in datas:
            # Check if pixel is close to white
            if item[0] > threshold and item[1] > threshold and item[2] > threshold:
                newData.append((255, 255, 255, 0))  # Make transparent
            else:
                newData.append(item)

        img.putdata(newData)
        img.save(output_path, "PNG")
        print(f"Processed: {output_path}")
    except Exception as e:
        print(f"Error processing {input_path}: {e}")

assets_dir = "/Users/apple/dev/chat-lion/src/assets"
files = {
    "Lion master.png": "lion_master.png",
    "Lion sleep.png": "lion_sleep.png",
    "Lionstand.png": "lion_stand.png",
    "Lion run.png": "lion_run.png"
}

for input_name, output_name in files.items():
    in_path = os.path.join(assets_dir, input_name)
    out_path = os.path.join(assets_dir, output_name)
    if os.path.exists(in_path):
        remove_white_bg(in_path, out_path)
    else:
        print(f"File not found: {in_path}")
