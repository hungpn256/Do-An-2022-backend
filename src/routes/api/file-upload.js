const router = require('express').Router();

const upload = require('../../services/file-upload.js');


router.post('/image-upload',upload.single('image'), function(req,res){
  return res.json({'imgUrl': req.file});
});

module.exports = router;