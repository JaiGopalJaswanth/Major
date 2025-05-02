function calculateLST(image) {
  var thermalBand = image.select('ST_B10');
  var brightnessTemp = thermalBand.multiply(0.00341802).add(149.0);
  var ndvi = image.normalizedDifference(['SR_B5', 'SR_B4']).rename('NDVI');
  var proportionVeg = ndvi.expression(
    '((ndvi-ndviMin) / (ndviMax - ndviMin)) ** 2', {
      'ndvi': ndvi,
      'ndviMin': 0.2,
      'ndviMax': 0.5
    }).rename('PV');
  var emissivity = proportionVeg.expression(
    '0.004 * proportionVeg + 0.986', {
      'proportionVeg': proportionVeg
    }).rename('emissivity');
  var lst = brightnessTemp.expression(
    '(Tb / (1 + (0.00115 * Tb / 14388) * log(emissivity))) - 273.15', {
      'Tb': brightnessTemp,
      'emissivity': emissivity
    }).rename('LST');
  return image.addBands([lst, proportionVeg, ndvi]);
}

// Function to mask clouds using the QA_PIXEL band
function maskClouds(image) {
  var qa = image.select('QA_PIXEL');
  var cloud = qa.bitwiseAnd(1 << 3).or(qa.bitwiseAnd(1 << 4));
  return image.updateMask(cloud.not());
}

// Set year and date range
var year = 2024;
var title = 'Annual_MeanLST'+year
var startDate = ee.Date.fromYMD(year, 1, 1);
var endDate = startDate.advance(1, 'year');

// Load Landsat collections
var landsat8Collection = ee.ImageCollection('LANDSAT/LC08/C02/T1_L2')
  .filterBounds(studyArea)
  // .filterDate(startDate, endDate)
  .map(maskClouds)
  .map(calculateLST);

var landsat9Collection = ee.ImageCollection('LANDSAT/LC09/C02/T1_L2')
  .filterBounds(studyArea)
  // .filterDate(startDate, endDate)
  .map(maskClouds)
  .map(calculateLST);

var mergedCollection = landsat8Collection.merge(landsat9Collection);
print(mergedCollection)


var meanLST = mergedCollection.select('LST')//.mean().clip(studyArea);
var meanIMG = mergedCollection.select('SR_B5','SR_B4','SR_B3'/*,'SR_B5','SR_B6','SR_B7','ST_B10'*/)//.mean().clip(studyArea);

// Add LST layer to the map
Map.centerObject(studyArea, 10);

//Map.addLayer(meanLST.filterDate('2017-01-01', '2017-12-31').mean().clip(studyArea), imageVisParam, 'Monthly Mean LST2017');

Map.addLayer(meanLST.filterDate('2019-01-01', '2019-12-31').mean().clip(studyArea), imageVisParam, 'Monthly Mean LST2019');
Map.addLayer(meanIMG.filterDate('2019-01-01', '2019-12-31').mean().clip(studyArea), [], 'Landsat 8-9');


Map.addLayer(meanLST.filterDate('2022-01-01', '2022-12-31').mean().clip(studyArea), imageVisParam, 'Monthly Mean LST2022');
//Map.addLayer(meanIMG.filterDate('2022-01-01', '2022-12-31').mean().clip(studyArea), imageVisParam2, 'Landsat 8-9');


Map.addLayer(meanLST.filterDate('2024-01-01', '2024-12-31').mean().clip(studyArea), imageVisParam, 'Monthly Mean LST2024');
//Map.addLayer(meanIMG.filterDate('2024-01-01', '2024-12-31').mean().clip(studyArea), imageVisParam2, 'Landsat 8-9');*/


Export.image.toDrive({
  image: meanLST.filterDate('2019-01-01', '2019-12-31').mean().clip(studyArea),
  description: 'MeanLST_2019',
  folder: 'EarthEngineExports',
  scale: 30,
  region: studyArea,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});



// Export LST for 2022
Export.image.toDrive({
  image: meanLST.filterDate('2022-01-01', '2022-12-31').mean().clip(studyArea),
  description: 'MeanLST_2022',
  folder: 'EarthEngineExports',
  scale: 30,
  region: studyArea,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});



Export.image.toDrive({
  image: meanLST.filterDate('2024-01-01', '2024-12-31').mean().clip(studyArea),
  description: 'MeanLST_2024',
  folder: 'EarthEngineExports',
  scale: 30,
  region: studyArea,
  fileFormat: 'GeoTIFF',
  maxPixels: 1e13
});