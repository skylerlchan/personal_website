"""
Image processing script for Hoverloon project images.
This script:
1. Enhances the first image (color correction, sharpness)
2. Removes background from the second image using AI (rembg)
3. Saves processed images to the public/images/projects/hoverloon/ directory
"""

from PIL import Image, ImageEnhance, ImageFilter
from rembg import remove
import sys
import os

def enhance_image(input_path, output_path):
    """Enhance image quality with color correction and sharpness."""
    try:
        img = Image.open(input_path)

        # Convert to RGB if necessary
        if img.mode != 'RGB':
            img = img.convert('RGB')

        # Enhance sharpness
        sharpness_enhancer = ImageEnhance.Sharpness(img)
        img = sharpness_enhancer.enhance(1.5)

        # Enhance contrast
        contrast_enhancer = ImageEnhance.Contrast(img)
        img = contrast_enhancer.enhance(1.2)

        # Enhance color
        color_enhancer = ImageEnhance.Color(img)
        img = color_enhancer.enhance(1.15)

        # Enhance brightness slightly
        brightness_enhancer = ImageEnhance.Brightness(img)
        img = brightness_enhancer.enhance(1.05)

        # Save with high quality
        img.save(output_path, 'PNG', quality=95, optimize=True)

        # Get file size
        file_size = os.path.getsize(output_path) / 1024  # KB
        print(f"✓ Enhanced image saved to {output_path} ({file_size:.1f} KB)")
        return True
    except Exception as e:
        print(f"✗ Error enhancing image: {e}")
        return False

def remove_background(input_path, output_path):
    """Remove background from image using AI-powered rembg."""
    try:
        print(f"  Processing {input_path} with rembg (this may take a moment)...")

        # Open input image
        with open(input_path, 'rb') as input_file:
            input_data = input_file.read()

        # Remove background using rembg (U2-Net model)
        output_data = remove(input_data)

        # Open as PIL Image
        img = Image.open(io.BytesIO(output_data))

        # Optimize and save
        img.save(output_path, 'PNG', optimize=True)

        # Get file size
        file_size = os.path.getsize(output_path) / 1024  # KB
        print(f"✓ Background removed, saved to {output_path} ({file_size:.1f} KB)")
        return True
    except Exception as e:
        print(f"✗ Error removing background: {e}")
        return False

import io

if __name__ == "__main__":
    # Set up paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    # Input images (user will need to place these in a temp directory)
    input_dir = os.path.join(project_root, "temp_images")
    output_dir = os.path.join(project_root, "public", "images", "projects", "hoverloon")

    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)

    # Check if input directory exists
    if not os.path.exists(input_dir):
        print(f"Please create {input_dir} and place your images there:")
        print("  - image1.png (first hoverloon image)")
        print("  - image2.png (second hoverloon image for 3D rotation)")
        sys.exit(1)

    # Process first image (enhancement)
    img1_input = os.path.join(input_dir, "image1.png")
    img1_output = os.path.join(output_dir, "hoverloon-main.png")

    if os.path.exists(img1_input):
        enhance_image(img1_input, img1_output)
    else:
        print(f"✗ {img1_input} not found")

    # Process second image (background removal)
    img2_input = os.path.join(input_dir, "image2.png")
    img2_output = os.path.join(output_dir, "hoverloon-3d.png")

    if os.path.exists(img2_input):
        remove_background(img2_input, img2_output)
    else:
        print(f"✗ {img2_input} not found")

    print("\nImage processing complete!")
