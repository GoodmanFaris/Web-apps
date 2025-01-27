var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../Database/db.js');
const path = require('path');
const {
  DodajObrazovanje,
  DodajRadnuVjestinu,
  DodajRadnoIskustvo,
  DeleteExp,
  DeleteEducation,
  KonkursDetails,
  DeleteRadnoIskustvo,
  downloadFile,
  UsersHome,
  LoginUser,
  SaveUser,
  PogledajPoruku,
  PosaljiPoruku,
  UpdateOMeni
} = require('../controllers/UsersController');

const multer = require('multer');

//const storage = multer.memoryStorage();
//const upload = multer({ storage: storage });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const filetypes = /pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .pdf files are allowed!'));
  }
});

const storageA = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile_pictures'); // Spremanje slika u folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const uploadA = multer({ storage: storageA });


const saltRounds = 10;

const getHashedPassword = async (plainPassword)=>{
  try{
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    return hashedPassword;
  }
  catch(error){
    throw error;
  }
}

router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});
router.get('/register', function(req, res, next) {
  res.render('user/register_form' , {title: 'Register'});
});
router.get('/login', function(req, res, next) {
  res.render('user/login_form' , {title: 'Login'});
});
router.get('/logout', function(req, res, next) {
  res.clearCookie('opkn');
  res.render('index' , {title: 'Logout'});
});

router.post('/save_user', SaveUser);
router.post('/login_user', LoginUser);
router.get('/home', UsersHome);

router.post('/upload-profile-picture', uploadA.single('profilePicture'), async (req, res) => {
  try {
    const kandidatId = req.body.kandidat_id; // Dobijate kandidat_id iz forme
    const slikaPath = req.file ? req.file.filename : null; // Ime fajla iz Multera

    if (!slikaPath) {
      return res.status(400).send('Slika nije uploadovana.');
    }

    // Spremanje u bazu
    await pool.query(
        'INSERT INTO kandidat_dokument (kandidat_id, slika) VALUES ($1, $2)',
        [kandidatId, slikaPath]
    );

    res.redirect('/users/home');
  } catch (error) {
    console.error(error);
    res.status(500).send('Greška pri spašavanju slike.');
  }
});

router.get('/download/:type/:id', downloadFile);

router.post('/uploadDocs', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'pm', maxCount: 1 },
  { name: 'certifikat', maxCount: 1 },
  { name: 'preporuke', maxCount: 1 }
]), async function(req, res, next) {
  try {
    const email = res.userData.email;

    // Extract file paths
    const cvPath = req.files['cv'] ? req.files['cv'][0].path : null;
    const pmPath = req.files['pm'] ? req.files['pm'][0].path : null;
    const certifikatPath = req.files['certifikat'] ? req.files['certifikat'][0].path : null;
    const preporukePath = req.files['preporuke'] ? req.files['preporuke'][0].path : null;

    const query = `
      INSERT INTO kandidat_dokument (cv, pm, certifikat, preporuke, kandidat_id)
      VALUES ($1, $2, $3, $4, (SELECT id FROM kandidat WHERE email = $5))
    `;
    await pool.query(query, [cvPath, pmPath, certifikatPath, preporukePath, email]);

    res.redirect('/users/home');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while uploading documents.');
  }
});

router.get('/delete/:id', DeleteRadnoIskustvo);
router.get('/details/:id', KonkursDetails);
router.get('/delete/edu/:id', DeleteEducation);
router.get('/delete/exp/:id', DeleteExp);
router.post('/add_new_exp', DodajRadnoIskustvo);
router.post('/add_new_skill', DodajRadnuVjestinu);
router.post('/add_new_obr', DodajObrazovanje);

router.post('/apply/:id', upload.fields([
  { name: 'cv', maxCount: 1 },
  { name: 'mp', maxCount: 1 },
  { name: 'certificate', maxCount: 1 },
  { name: 'recommendations', maxCount: 1 }
]), async function (req, res, next) {
  const idKonkursa = req.params.id;
  try {
    // Retrieve kandidat_id
    const kandidatQuery = 'SELECT id FROM kandidat WHERE email = $1';
    const kandidatResult = await pool.query(kandidatQuery, [res.userData.email]);

    if (kandidatResult.rows.length === 0) {
      return res.status(404).send('Kandidat not found');
    }
    const kandidatId = kandidatResult.rows[0].id;

    // Extract file buffers
    let cv = null, mp = null, certificate = null, recommendations = null;

    if (req.files['cv']) {
      cv = req.files['cv'][0].buffer;
    }
    if (req.files['mp']) {
      mp = req.files['mp'][0].buffer;
    }
    if (req.files['certificate']) {
      certificate = req.files['certificate'][0].buffer;
    }
    if (req.files['recommendations']) {
      recommendations = req.files['recommendations'][0].buffer;
    }
    const query = `
            INSERT INTO konkurs_kandidat (kandidat_id, konkurs_id, cv, mp, certifikat, preporuka)
            VALUES ($1, $2, $3, $4, $5, $6)
        `;
    const values = [kandidatId, idKonkursa, cv, mp, certificate, recommendations];

    await pool.query(query, values);

    res.redirect("/home/");
  } catch (error) {
    console.error('Error saving application:', error);
    res.status(500).send('Internal Server Error');
  }
});


router.post('/update/:id', UpdateOMeni);
router.get('/contact', function (req, res, next) {
  res.render('contact');
});
router.post('/contact/send', PosaljiPoruku);
router.get('/message/:id', PogledajPoruku);


module.exports = router;
