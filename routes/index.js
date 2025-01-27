var express = require('express');
const pool = require("../Database/db");
var router = express.Router();

/* GET home page. */
router.get('/home', async function(req, res, next) {
  const query = 'SELECT * FROM konkurs WHERE datum_isteka > CURRENT_DATE AND aktivan = 1;';
  const result = await pool.query(query);
  res.render('Main', { title: 'Express' , konkursi: result.rows});
});

router.get('/home/nk', async function(req, res, next) {
  const query = 'SELECT * FROM konkurs ORDER BY naziv_kompanije DESC;';
  const result = await pool.query(query);
  res.render('Main', { title: 'Express' , konkursi: result.rows});
});

router.get('/home/di', async function(req, res, next) {
  const query = 'SELECT * FROM konkurs ORDER BY datum_isteka DESC;';
  const result = await pool.query(query);
  res.render('Main', { title: 'Express' , konkursi: result.rows});
});

router.get('/home/bpk', async function(req, res, next) {
  const query = 'SELECT      k.*,      COUNT(kk.konkurs_id) AS broj_kandidata FROM      konkurs k LEFT JOIN      konkurs_kandidat kk  ON      k.id = kk.konkurs_id GROUP BY      k.id ORDER BY      broj_kandidata DESC; ';
  const result = await pool.query(query);
  res.render('Main', { title: 'Express' , konkursi: result.rows});
});

router.get('/details/:id', async function(req, res, next) {
  const idKonkursa = req.params.id;
  try {
    const query = 'SELECT * FROM konkurs WHERE id = $1;';
    const result = await pool.query(query, [idKonkursa]);

    if (result.rows.length === 0) {
      return res.status(404).send('Konkurs not found');
    }

    res.render('konkursDetails', {
      konkurs: result.rows,
    });
  } catch (error) {
    console.error('Error fetching konkurs details:', error);
    next(error);
  }
});

router.get('/', function(req, res, next) {
  res.render('Intro');
});

router.get('/about', function(req, res, next) {
  res.render('about')
});

router.get('/logout', async function(req, res, next) {
  res.clearCookie('opkn');
  res.redirect('/');
});



module.exports = router;
