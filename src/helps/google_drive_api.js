const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');
const { googleapis } = require('../config/keys.js');

const { CLIENT_ID, CLIENT_SECRET,REDIRECT_URI, REFRESH_TOKEN } = googleapis;


const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

const drive = google.drive({
  version: 'v3',
  auth: oauth2Client
});

const filePath = (name) => {
  return path.join(path.dirname(__dirname), "uploads", name);
}

const splitMimeType = (name) => {
  const data = name.split('.');
  const tail = data[data.length - 1];
  return "image/" + tail;
}


module.exports.uploadFile = async (name) => {
  try {
    
    const mimeType = splitMimeType(name);

    const res = await drive.files.create({
      requestBody: {
        name: name,
        mimeType: mimeType
      },
      media: {
        mimeType: mimeType,
        body: fs.createReadStream(filePath(name))
      }
    });
    
    return {
      success: true,
      data: res.data
    };

  } catch (error) {
    return {
      success: false,
      error
    };
  }
}

module.exports.generatePublicUrl = async (fileId) => {
  try {
    
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: 'anyone'
      }
    });

    const result = await drive.files.get({
      fileId: fileId,
      fields: 'thumbnailLink, webContentLink'
    });

    return {
      success: true,
      data: result.data
    };

  } catch (error) {
    return {
      success: false,
      error
    };
  }
}

module.exports.deleteFile = async (fileId) => {
  try {
    
    const result = await drive.files.delete({
      fileId: fileId
    })

    return {
      success: true,
      status: result.status
    }

  } catch (error) {
    return {
      success: false,
      error
    };
  }
}

