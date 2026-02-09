/**
 * @file image-processing.js
 * @description This example simulates a parallel image processing pipeline using Tasklets.
 * It demonstrates how to handle a variety of image processing tasks concurrently:
 * - Batch processing of images to generate different variants (e.g., resizing, thumbnails).
 * - Applying a set of filters to multiple images in parallel.
 * - Performing image analysis, such as color analysis, face detection, and object detection, in parallel.
 * The processing functions are simulations and do not require any external image processing libraries or actual image files.
 * This is a good example of how to manage a pipeline of CPU-bound tasks.
 */
const tasklets = require('../../../lib');
const fs = require('fs');
const path = require('path');

console.log('Tasklets - Image Processing Example\n');

// Simulated image processing function
function processImage(imagePath, options) {
  const { width, height, quality, operation } = options;

  const startTime = Date.now();

  // Simulate CPU-intensive image processing
  const processingTime = Math.random() * 200 + 100; // 100-300ms
  const endTime = startTime + processingTime;

  while (Date.now() < endTime) {
    // Simulate processing work
    Math.sqrt(Math.random() * 1000000);
  }

  const originalSize = Math.floor(Math.random() * 2000000) + 500000; // 500KB - 2.5MB
  const compressionRatio = quality / 100;
  const newSize = Math.floor(originalSize * compressionRatio);

  return {
    originalPath: imagePath,
    processedPath: `processed_${width}x${height}_q${quality}_${operation}_${path.basename(imagePath)}`,
    operation,
    dimensions: { width, height },
    quality,
    originalSize,
    processedSize: newSize,
    compressionRatio: ((originalSize - newSize) / originalSize * 100).toFixed(1),
    processingTime: Date.now() - startTime,
    timestamp: new Date().toISOString()
  };
}

function applyFilter(imagePath, filterType) {
  const startTime = Date.now();

  // Simulate filter processing
  const processingTime = Math.random() * 150 + 50; // 50-200ms
  const endTime = startTime + processingTime;

  while (Date.now() < endTime) {
    Math.sqrt(Math.random() * 500000);
  }

  return {
    originalPath: imagePath,
    processedPath: `filtered_${filterType}_${path.basename(imagePath)}`,
    filterType,
    processingTime: Date.now() - startTime,
    timestamp: new Date().toISOString()
  };
}

async function batchProcessImages() {
  const images = [
    'image1.jpg', 'image2.jpg', 'image3.jpg', 'image4.jpg',
    'image5.jpg', 'image6.jpg', 'image7.jpg', 'image8.jpg'
  ];

  const processingOptions = [
    { width: 800, height: 600, quality: 80, operation: 'resize' },
    { width: 400, height: 300, quality: 70, operation: 'resize' },
    { width: 200, height: 150, quality: 60, operation: 'thumbnail' },
    { width: 1920, height: 1080, quality: 90, operation: 'hd_resize' }
  ];

  const tasks = [];

  for (const image of images) {
    for (const options of processingOptions) {
      tasks.push({ image, options });
    }
  }

  console.log(`Processing ${tasks.length} image variants in parallel...`);
  const startTime = Date.now();

  const results = await tasklets.runAll(
    tasks.map(({ image, options }) =>
      () => processImage(image, options)
    )
  );

  const endTime = Date.now();

  console.log(`Processed ${results.length} images in ${endTime - startTime}ms`);

  // Group results by original image
  const grouped = results.reduce((acc, result) => {
    const key = result.originalPath;
    if (!acc[key]) acc[key] = [];
    acc[key].push(result);
    return acc;
  }, {});

  console.log('\nProcessing Summary:');
  Object.entries(grouped).forEach(([image, variants]) => {
    console.log(`\n${image}:`);
    variants.forEach(variant => {
      console.log(`  ${variant.dimensions.width}x${variant.dimensions.height} (Q${variant.quality}): ${variant.processedSize} bytes, ${variant.processingTime}ms`);
    });
  });

  return grouped;
}

async function applyFiltersInParallel() {
  const images = ['photo1.jpg', 'photo2.jpg', 'photo3.jpg', 'photo4.jpg'];
  const filters = ['blur', 'sharpen', 'sepia', 'grayscale', 'vintage', 'contrast'];

  const filterTasks = [];

  for (const image of images) {
    for (const filter of filters) {
      filterTasks.push({ image, filter });
    }
  }

  console.log(`\nApplying ${filterTasks.length} filters in parallel...`);
  const startTime = Date.now();

  const results = await tasklets.runAll(
    filterTasks.map(({ image, filter }) =>
      () => applyFilter(image, filter)
    )
  );

  const endTime = Date.now();

  console.log(`Applied ${results.length} filters in ${endTime - startTime}ms`);

  // Group by filter type
  const filterStats = results.reduce((acc, result) => {
    const filter = result.filterType;
    if (!acc[filter]) {
      acc[filter] = {
        count: 0,
        totalTime: 0,
        avgTime: 0
      };
    }
    acc[filter].count++;
    acc[filter].totalTime += result.processingTime;
    acc[filter].avgTime = acc[filter].totalTime / acc[filter].count;
    return acc;
  }, {});

  console.log('\nFilter Performance:');
  Object.entries(filterStats).forEach(([filter, stats]) => {
    console.log(`  ${filter}: ${stats.count} applications, avg ${stats.avgTime.toFixed(1)}ms`);
  });

  return results;
}

async function imageAnalysis() {
  const images = Array.from({ length: 20 }, (_, i) => `analysis_image_${i + 1}.jpg`);

  console.log(`\nAnalyzing ${images.length} images in parallel...`);

  const analysisPromises = [
    // Color analysis
    () => {
      const results = images.map(image => {
        // Simulate color analysis
        const processingTime = Math.random() * 100 + 50;
        const start = Date.now();
        while (Date.now() - start < processingTime) {
          Math.sqrt(Math.random() * 100000);
        }

        return {
          image,
          dominantColors: ['#FF5733', '#33FF57', '#3357FF'].slice(0, Math.floor(Math.random() * 3) + 1),
          colorfulness: Math.random() * 100,
          brightness: Math.random() * 100,
          contrast: Math.random() * 100,
          processingTime: Date.now() - start
        };
      });

      return {
        analysis: 'color-analysis',
        results,
        avgProcessingTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
      };
    },

    // Face detection simulation
    () => {
      const results = images.map(image => {
        // Simulate face detection
        const processingTime = Math.random() * 200 + 100;
        const start = Date.now();
        while (Date.now() - start < processingTime) {
          Math.sqrt(Math.random() * 200000);
        }

        const faceCount = Math.floor(Math.random() * 4); // 0-3 faces
        const faces = Array.from({ length: faceCount }, (_, i) => ({
          id: i + 1,
          confidence: Math.random() * 0.3 + 0.7, // 70-100% confidence
          bounds: {
            x: Math.floor(Math.random() * 500),
            y: Math.floor(Math.random() * 500),
            width: Math.floor(Math.random() * 100) + 50,
            height: Math.floor(Math.random() * 100) + 50
          }
        }));

        return {
          image,
          faceCount,
          faces,
          processingTime: Date.now() - start
        };
      });

      return {
        analysis: 'face-detection',
        results,
        avgProcessingTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
      };
    },

    // Object detection simulation
    () => {
      const objects = ['person', 'car', 'dog', 'cat', 'tree', 'building', 'bicycle', 'flower'];

      const results = images.map(image => {
        // Simulate object detection
        const processingTime = Math.random() * 300 + 150;
        const start = Date.now();
        while (Date.now() - start < processingTime) {
          Math.sqrt(Math.random() * 300000);
        }

        const detectedObjects = objects
          .filter(() => Math.random() > 0.7) // 30% chance for each object
          .map(object => ({
            type: object,
            confidence: Math.random() * 0.4 + 0.6, // 60-100% confidence
            bounds: {
              x: Math.floor(Math.random() * 400),
              y: Math.floor(Math.random() * 400),
              width: Math.floor(Math.random() * 200) + 50,
              height: Math.floor(Math.random() * 200) + 50
            }
          }));

        return {
          image,
          objectCount: detectedObjects.length,
          objects: detectedObjects,
          processingTime: Date.now() - start
        };
      });

      return {
        analysis: 'object-detection',
        results,
        avgProcessingTime: results.reduce((sum, r) => sum + r.processingTime, 0) / results.length
      };
    }
  ];

  const analysisResults = await tasklets.runAll(analysisPromises);

  console.log('\nImage Analysis Results:');
  analysisResults.forEach(result => {
    console.log(`\n${result.analysis}:`);
    console.log(`  Processed: ${result.results.length} images`);
    console.log(`  Average processing time: ${result.avgProcessingTime.toFixed(1)}ms`);

    if (result.analysis === 'color-analysis') {
      const avgBrightness = result.results.reduce((sum, r) => sum + r.brightness, 0) / result.results.length;
      const avgContrast = result.results.reduce((sum, r) => sum + r.contrast, 0) / result.results.length;
      console.log(`  Average brightness: ${avgBrightness.toFixed(1)}%`);
      console.log(`  Average contrast: ${avgContrast.toFixed(1)}%`);
    } else if (result.analysis === 'face-detection') {
      const totalFaces = result.results.reduce((sum, r) => sum + r.faceCount, 0);
      const imagesWithFaces = result.results.filter(r => r.faceCount > 0).length;
      console.log(`  Total faces detected: ${totalFaces}`);
      console.log(`  Images with faces: ${imagesWithFaces}/${result.results.length}`);
    } else if (result.analysis === 'object-detection') {
      const totalObjects = result.results.reduce((sum, r) => sum + r.objectCount, 0);
      const imagesWithObjects = result.results.filter(r => r.objectCount > 0).length;
      console.log(`  Total objects detected: ${totalObjects}`);
      console.log(`  Images with objects: ${imagesWithObjects}/${result.results.length}`);
    }
  });
}

// Run the example
(async () => {
  try {
    // Batch process images with different sizes/qualities
    await batchProcessImages();

    // Apply filters in parallel
    await applyFiltersInParallel();

    // Perform image analysis
    await imageAnalysis();

    console.log('\nImage processing example completed!');
  } catch (error) {
    console.error('Error:', error.message);
  }
})(); 