const controller = {};
const connection = require("../dbConnection/connection");
const DigiModel = require("../models/digimon.model");
const s3 = require("../s3config/s3connection") //Llamar a la conexion con s3
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
require("dotenv").config();
const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME


controller.index = async (req, res) => {
  try {
    await connection();
    const allDigimons = await DigiModel.find();

    console.log("Objetos en BD: " + allDigimons.length);
    res.send(`<body style="background-color: black;">
    <h1 style="color: white;">Servidor corriendo</h1>
    <h3 style="color: white;">Hay ${allDigimons.length} digimons en MongoDB</h3>
    </body>`);
  } catch (err) {
    console.error(err);
  }
}


// MONGO DB CONTROLLERS:

controller.addDigimonToBD = async (req, res) => {
  try {
    const { name, id, xAntibody, releaseDate, image, levels, fields,
      attributes, descriptions, skills, types, priorEvolutions, nextEvolutions } = req.body;
    const newDigimon = {
      name: name,
      id: id,
      types: types,
      xAntibody: xAntibody,
      releaseDate: releaseDate,
      image: image,
      levels: levels,
      fields: fields,
      attributes: attributes,
      descriptions: descriptions,
      skills: skills,
      priorEvolutions: priorEvolutions,
      nextEvolutions: nextEvolutions
    };
    await connection();
    await DigiModel.create(newDigimon);

    console.log("Se cargo el Digimon");
    //res.redirect('/')

  } catch (err) {
    console.error(err);
  }
};

controller.getDigimonFromBD = async (req, res) =>{
  try {
    await connection();
    const digimon = await DigiModel.findOne({ name: req.params.name });

    res.json(digimon);
    console.log("Digimon enviado");

  } catch (err) {
    console.error(err);
  }
}



// AWS CONTROLLERS:

controller.sendImagesToAWS = async (req, res) => {
  try {
    console.log('Recibido');

    // Obtiene el nombre del archivo y el contenido del archivo a partir de la request del cliente
    const fileName = req.body.fileName;
    const fileBlob = req.file;

    // Prepara los parámetros para la subida del archivo a S3 
    const params = {
      Bucket: AWS_BUCKET_NAME,
      Key: fileName,
      ContentType: fileBlob.mimetype,
      Body: fileBlob.buffer
    };

    //Se crea instancia de PutObjectCommand para utilizarla en el metodo send() de s3
    const command = new PutObjectCommand(params);

    s3.send(command, function (err, data) {
      if (err) {
        console.log('Error', err);
      }
      if (data) {
        console.log('Subido correctamente');
      }
    });

  }
  catch (err) {
    console.error(err);
  }
};

controller.getImagesFromAWS = async (req, res) => {
  try {
    const digiName = req.params.name + ".png";

    console.log(digiName);

    const params = {
      Bucket: AWS_BUCKET_NAME,
      Key: digiName,
    };

    const command = new GetObjectCommand(params);

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });

    res.json({ url, ok: true });

  }
  catch (err) {
    console.error(err);
  }

};


module.exports = controller;