#!/usr/bin/env python3
"""
Router/Switch Detection - Inference Script
Test your trained YOLO model on images
"""

from ultralytics import YOLO
import cv2
import os
from pathlib import Path
import argparse

def run_inference(
    model_path,
    image_path,
    conf_threshold=0.25,
    save_output=True,
    output_dir='inference_results'
):
    """
    Run inference on a single image or directory
    
    Args:
        model_path: Path to trained YOLO model (.pt file)
        image_path: Path to image or directory of images
        conf_threshold: Confidence threshold for detections
        save_output: Save annotated images
        output_dir: Directory to save results
    """
    
    # Check if model exists
    if not os.path.exists(model_path):
        print(f"❌ Model not found at: {model_path}")
        print("Train a model first using: python train.py")
        return
    
    # Load model
    print(f"📦 Loading model: {model_path}")
    model = YOLO(model_path)
    
    # Check if image/directory exists
    if not os.path.exists(image_path):
        print(f"❌ Image not found at: {image_path}")
        return
    
    # Create output directory
    if save_output:
        os.makedirs(output_dir, exist_ok=True)
    
    # Run inference
    print(f"\n🔍 Running inference on: {image_path}")
    print(f"Confidence threshold: {conf_threshold}")
    
    try:
        results = model.predict(
            source=image_path,
            conf=conf_threshold,
            save=save_output,
            project=output_dir,
            name='predict',
            exist_ok=True
        )
        
        # Process results
        print(f"\n✅ Inference completed!")
        print(f"Processed {len(results)} image(s)")
        
        for i, result in enumerate(results):
            print(f"\n📊 Results for image {i+1}:")
            print(f"   Image: {result.path}")
            
            if len(result.boxes) == 0:
                print("   ⚠️  No objects detected")
                continue
            
            print(f"   Detected {len(result.boxes)} object(s):")
            
            # Print each detection
            for j, box in enumerate(result.boxes):
                class_id = int(box.cls[0])
                class_name = result.names[class_id]
                confidence = float(box.conf[0])
                bbox = box.xyxy[0].cpu().numpy()
                
                print(f"\n   Detection #{j+1}:")
                print(f"      Class: {class_name}")
                print(f"      Confidence: {confidence:.4f}")
                print(f"      BBox: [{bbox[0]:.1f}, {bbox[1]:.1f}, {bbox[2]:.1f}, {bbox[3]:.1f}]")
        
        if save_output:
            print(f"\n💾 Annotated images saved to: {output_dir}/predict/")
        
        return results
        
    except Exception as e:
        print(f"❌ Inference failed: {e}")
        return None

def batch_inference(
    model_path,
    image_dir,
    output_csv='inference_results.csv',
    conf_threshold=0.25
):
    """Run inference on multiple images and save to CSV"""
    import pandas as pd
    
    if not os.path.exists(model_path):
        print(f"❌ Model not found: {model_path}")
        return
    
    if not os.path.exists(image_dir):
        print(f"❌ Directory not found: {image_dir}")
        return
    
    print(f"📦 Loading model: {model_path}")
    model = YOLO(model_path)
    
    # Get all images
    image_extensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff']
    image_files = []
    for ext in image_extensions:
        image_files.extend(Path(image_dir).glob(f'*{ext}'))
        image_files.extend(Path(image_dir).glob(f'*{ext.upper()}'))
    
    if len(image_files) == 0:
        print(f"❌ No images found in: {image_dir}")
        return
    
    print(f"🔍 Processing {len(image_files)} images...")
    
    # Store results
    results_data = []
    
    for img_path in image_files:
        results = model.predict(str(img_path), conf=conf_threshold, verbose=False)
        
        if len(results[0].boxes) == 0:
            results_data.append({
                'image': img_path.name,
                'class': 'None',
                'confidence': 0.0,
                'bbox': 'None'
            })
        else:
            for box in results[0].boxes:
                class_id = int(box.cls[0])
                class_name = results[0].names[class_id]
                confidence = float(box.conf[0])
                bbox = box.xyxy[0].cpu().numpy().tolist()
                
                results_data.append({
                    'image': img_path.name,
                    'class': class_name,
                    'confidence': confidence,
                    'bbox': str(bbox)
                })
    
    # Save to CSV
    df = pd.DataFrame(results_data)
    df.to_csv(output_csv, index=False)
    
    print(f"\n✅ Batch inference completed!")
    print(f"📊 Results saved to: {output_csv}")
    print(f"Total detections: {len(results_data)}")
    
    return df

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run inference with trained YOLO model')
    parser.add_argument('--model', type=str, default='models/best.pt',
                        help='Path to trained model')
    parser.add_argument('--image', type=str, required=True,
                        help='Path to image or directory')
    parser.add_argument('--conf', type=float, default=0.25,
                        help='Confidence threshold')
    parser.add_argument('--output', type=str, default='inference_results',
                        help='Output directory')
    parser.add_argument('--batch', action='store_true',
                        help='Run batch inference and save to CSV')
    parser.add_argument('--csv', type=str, default='inference_results.csv',
                        help='CSV output file for batch inference')
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("🔍 YOLO Router/Switch Detection - Inference")
    print("=" * 60)
    
    if args.batch:
        batch_inference(
            model_path=args.model,
            image_dir=args.image,
            output_csv=args.csv,
            conf_threshold=args.conf
        )
    else:
        run_inference(
            model_path=args.model,
            image_path=args.image,
            conf_threshold=args.conf,
            output_dir=args.output
        )
    
    print("\n" + "=" * 60)
    print("✨ Inference completed")
    print("=" * 60)