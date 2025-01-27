var express = require('express');
const pool = require("../Database/db");
const result = require("pg/lib/query");
var router = express.Router();
const { AdminHome,
    SaveKonkurs,
    viewKonkurs,
    StatusOdbijen,
    statusInterviju,
    statusUziIzbor,
    statusPrihvacen,
    ViewKandidatKonkurs,
    scheduleInterview,
    critique,
    dashboard,
    dashboardKonkurs,
    critiqueUser,
    MessageResponse,
    MessageResponseHR,
    SendMessage,
    DeleteKonkurs,
    ViewAllKonkurs,
    ViewAllKonkursSorted1,
    ViewAllKonkursSorted2,
    ViewAllKonkursSorted3,
    AllMessages,
    AllMessagesSorted1,
    AllMessagesSorted2,
    AllMessagesSorted3,
    ViewMessageUsers,
    ViewMessageHR,
    viewAllUsers,
    viewAllUsersSorted1,
    viewAllUsersSorted2,
    viewUser
} = require('../controllers/AdminController');

function isAdmin(req, res, next) {
    if (res.userData && res.userData.jeliadmin) {
        next();
    } else {
        res.status(403).render('NijeAdmin');
    }
}

router.use(isAdmin);

router.get('/', AdminHome);
router.post('/save_konkurs', SaveKonkurs);
router.get('/view/konkurs/:id', viewKonkurs);
router.get('/statusOdbijen/:idU/:idK', StatusOdbijen);
router.get('/statusInterview/:idU/:idK', statusInterviju);
router.get('/statusUziIzb/:idU/:idK', statusUziIzbor);
router.get('/statusPrihvacen/:idU/:idK', statusPrihvacen);
router.get('/view/konkurs/:idKonkurs/kandidat/:idKandidat', ViewKandidatKonkurs);
router.post('/scheduleInterview/:idU/:idK', scheduleInterview);

const fs = require('fs');
const path = require('path');

router.get('/download/:idKandidat/:fileType', async function (req, res, next) {

    const { idKandidat, fileType } = req.params;

    const fileColumns = {
        cv: 'cv',
        mp: 'mp',
        certifikat: 'certifikat',
        preopruka: 'preporuka',
    };

    const column = fileColumns[fileType];
    if (!column) {
        return res.status(400).send('Invalid file type.');
    }

    try {
        const query = `SELECT ${column} FROM konkurs_kandidat WHERE kandidat_id = $1`;
        const result = await pool.query(query, [idKandidat]);

        if (result.rows.length === 0 || !result.rows[0][column]) {
            return res.status(404).send('File not found.');
        }

        const fileBuffer = result.rows[0][column];

        res.setHeader('Content-Disposition', `attachment; filename=${fileType}.pdf`);
        res.setHeader('Content-Type', 'application/pdf');

        res.send(fileBuffer);
    } catch (error) {
        console.error('Error fetching file:', error);
        res.status(500).send('An error occurred while fetching the file.');
    }
});

router.post('/add_critique/:id/:idKonk', critique);
router.get('/dashboard', dashboard);
router.get('/dashboard/konkurs/:id', dashboardKonkurs);
router.post('/add_critique/:id', critiqueUser);
router.post('/message/odgovor/:id', MessageResponse);
router.post('/message/odgovor/HR/:id', MessageResponseHR);
router.post('/send/message', SendMessage);
router.get('/delete/konkurs/:id', DeleteKonkurs);
router.get('/viewall/konkurs', ViewAllKonkurs);
router.get('/viewall/konkurs/nk', ViewAllKonkursSorted1);
router.get('/viewall/konkurs/di', ViewAllKonkursSorted2);
router.get('/viewall/konkurs/bpk', ViewAllKonkursSorted3);
router.get('/kreiraj_konkurs', function (req, res, next) {
    res.render('admin/kreiraj_konkurs');
});
router.get('/upravljaj_konkursima', function (req, res, next) {
    res.render('admin/upravljaj_konkursima');
});
router.get('/all-messages', AllMessages);
router.get('/all-messages/i', AllMessagesSorted1);
router.get('/all-messages/d', AllMessagesSorted2);
router.get('/all-messages/s', AllMessagesSorted3);
router.get('/message/users/:id', ViewMessageUsers);
router.get('/message/HR/:id', ViewMessageHR);
router.get('/all-users', viewAllUsers);
router.get('/all-users/i', viewAllUsersSorted1);
router.get('/all-users/p', viewAllUsersSorted2);
router.get('/view/user/:id', viewUser);





module.exports = router;


