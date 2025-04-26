const faceapi = require('face-api.js');
const canvas = require('canvas');
const fetch = require('node-fetch');

const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const loadModels = async () => {
    await faceapi.nets.ssdMobilenetv1.loadFromDisk('./face_models');
    await faceapi.nets.faceLandmark68Net.loadFromDisk('./face_models');
    await faceapi.nets.faceRecognitionNet.loadFromDisk('./face_models');    
};

const fetchImageFromUrl = async (url) => {
  const response = await fetch(url);
  const buffer = await response.buffer();
  const img = await canvas.loadImage(buffer);
  return img;
};

const compareFaces = async (imageUrl1, imageUrl2) => {
  console.log("Image URL 1:", imageUrl1);
  console.log("Image URL 2:", imageUrl2);

  const img1 = await fetchImageFromUrl(imageUrl1);
  const img2 = await fetchImageFromUrl(imageUrl2);

  const desc1 = await faceapi.detectSingleFace(img1).withFaceLandmarks().withFaceDescriptor();
  const desc2 = await faceapi.detectSingleFace(img2).withFaceLandmarks().withFaceDescriptor();

  if (!desc1 || !desc2) return false;

  const distance = faceapi.euclideanDistance(desc1.descriptor, desc2.descriptor);
  return distance < 0.35; // Ngưỡng xác thực (bạn có thể điều chỉnh)
};

module.exports = { loadModels, compareFaces };
