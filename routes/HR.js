var express = require('express');
const pool = require("../Database/db");
var router = express.Router();
const {
    PosaljiPoruku,
    OdgovorAdmin,
    PogledajPorukuAdmin,
    PorukeAdmin,
    OdgovorUser,
    PogledajPorukuUser,
    PorukeUser,
    OcjeniUser,
    HRHome
} = require('../controllers/HRController');


function isHR(req, res, next) {
    if (res.userData && res.userData.jelihr) {
        next();
    } else {
        res.status(403).render('NijeAdmin');
    }
}


router.use(isHR);

router.get('/', HRHome);
router.get('/rate/:id', OcjeniUser);
router.get('/poruke/users', PorukeUser);
router.get('/message/users/:id', PogledajPorukuUser);
router.post('/message/odgovor/users/:id', OdgovorUser);
router.get('/poruke/admin', PorukeAdmin);
router.get('/message/admin/:id', PogledajPorukuAdmin);
router.post('/message/odgovor/admin/:id', OdgovorAdmin);
router.post('/send/message', PosaljiPoruku);




module.exports = router;