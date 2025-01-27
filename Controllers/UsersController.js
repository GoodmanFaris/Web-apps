var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../Database/db.js');
const path = require('path');

const multer = require('multer');
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

const SaveUser = async (req, res, next) => {
    try {
        const hashedPassword = await getHashedPassword(String(req.body.lozinka));
        const userFromReq = {
            ime: req.body.ime,
            prezime: req.body.prezime,
            email: req.body.email,
            lozinka: hashedPassword
        }

        console.log("USER: ", userFromReq);

        const query = "insert into kandidat(ime, prezime, email, lozinka) values($1, $2, $3, $4);";
        const result = await pool.query(query, [userFromReq.ime,
            userFromReq.prezime,
            userFromReq.email,
            userFromReq.lozinka]);

        console.log("DATA", result.rows);

        res.redirect('/users/login');
    } catch (error) {
        console.error("Error inserting job into database:", error);
        res.status(500).send("Internal Server Error");
    }
}

const LoginUser = async (req, res, next) => {
    try{
        if(String(req.body.lozinka)=='admin123' && req.body.email == 'admin@admin.com'){
            const hashedPassword = 'admin123';
            const userFromReq = {
                email: req.body.email,
                lozinka: req.body.lozinka
            }
            const query = "SELECT * FROM kandidat WHERE email = $1;";
            const result = await pool.query(query, [
                userFromReq.email]);

            const user = result.rows[0];

            res.cookie("opkn", user);

            res.redirect('/admin');
        }

        if(String(req.body.lozinka)=='HR123' && req.body.email == 'HR1@HR.com'){
            const hashedPassword = 'HR123';
            const userFromReq = {
                email: req.body.email,
                lozinka: req.body.lozinka
            }
            const query = "SELECT * FROM kandidat WHERE email = $1;";
            const result = await pool.query(query, [
                userFromReq.email]);

            const user = result.rows[0];

            res.cookie("opkn", user);

            res.redirect('/HR');
        }


        const hashedPassword = await getHashedPassword(String(req.body.lozinka));
        const userFromReq = {
            email: req.body.email,
            lozinka: req.body.lozinka
        }

        console.log("USER: ", userFromReq);

        const query = "SELECT * FROM kandidat WHERE email = $1;";
        const result = await pool.query(query, [
            userFromReq.email]);


        if(result.rows.length > 0){
            const user = result.rows[0];
            console.log("Pass ", userFromReq.lozinka);
            console.log("H Pass ", user.lozinka);
            console.log("HH ", hashedPassword);

            bcrypt.compare(userFromReq.lozinka, user.lozinka, function (err, resultCompare) {
                if(resultCompare) {
                    console.log("Uspjesno logovan user");
                    res.cookie("opkn", user)
                    ;//res.render('user/home', {title: user.email})
                    return res.redirect('/');
                }
                else {
                    return res.send(err);
                }
            });
        }
    }
        catch (error) {
                console.error("Error inserting job into database:", error);
                res.status(500).send("Internal Server Error");
            }
}

const UsersHome = async (req, res, next) => {
    try {
        // Query for user data
        const query = "SELECT * FROM kandidat WHERE email = $1;";
        const result = await pool.query(query, [res.userData.email]);

        // Queries for additional user-related data
        const query1 = "SELECT * FROM kandidat_radno_iskustvo WHERE kandidat_id = (" +
            "SELECT id FROM kandidat WHERE email = $1);";
        const result1 = await pool.query(query1, [res.userData.email]);

        const queryExample = `
            INSERT INTO kandidat_licni_podaci(datum_rodjenja, adresa_stanovanja, kandidat_id)
            VALUES('2000-01-01', '.', (SELECT id FROM kandidat WHERE email = $1))
            `;

        await pool.query(queryExample, [res.userData.email]);
        await pool.query(queryExample, [res.userData.email]);
        const queryLP = "SELECT * FROM kandidat_licni_podaci WHERE kandidat_id = (" +
            "SELECT id FROM kandidat WHERE email = $1);";
        const resultLP = await pool.query(queryLP, [res.userData.email]);

        const queryV = "SELECT * FROM kandidat_vjestine WHERE kandidat_id = (" +
            "SELECT id FROM kandidat WHERE email = $1);";
        const resultV = await pool.query(queryV, [res.userData.email]);

        const queryO = "SELECT * FROM kandidat_obrazovanje WHERE kandidat_id = ("+
            "SELECT id FROM kandidat WHERE email = $1);";
        const resultO = await pool.query(queryO, [res.userData.email]);

        const queryK = "SELECT * FROM konkurs INNER JOIN konkurs_kandidat ON konkurs_id" +
            "=konkurs.id WHERE kandidat_id = (SELECT id FROM kandidat WHERE email = $1);";
        const resultK = await pool.query(queryK, [res.userData.email]);

        const queryid = "SELECT * FROM kandidat WHERE email = $1;";
        const resultid = await pool.query(queryid, [res.userData.email]);

        const queryPoruke = "SELECT * FROM poruke_kandidat_admin WHERE kandidat_id = ("+
            "SELECT id FROM kandidat WHERE email = $1);";
        const resultPoruke = await pool.query(queryPoruke, [res.userData.email]);

        const queryPorukeHr = "SELECT * FROM poruke_kandidat_hr WHERE kandidat_id = ("+
            "SELECT id FROM kandidat WHERE email = $1);";
        const resultPorukeHr = await pool.query(queryPorukeHr, [res.userData.email]);

        // Query for documents
        const queryDocs = "SELECT cv, pm, certifikat, preporuke FROM kandidat_dokument WHERE kandidat_id = (SELECT id FROM kandidat WHERE email = $1);";
        const resultDocs = await pool.query(queryDocs, [res.userData.email]);


        if (result.rows.length > 0) {
            const user = result.rows[0];
            res.render('user/home', {
                title: res.userData.email,
                ime: user.ime,
                prezime: user.prezime,
                email: res.userData.email,
                idUser: resultid.rows[0].id,
                iskustvo: result1.rows,
                vjestine: resultV.rows,
                obrazovanje: resultO.rows,
                datum_rodjenja: resultLP.rows[0].datum_rodjenja ? resultLP.rows[0].datum_rodjenja : '1.1.2000',
                adresa: resultLP.rows[0].adresa_stanovanja,
                opis: resultLP.rows[0].o_meni,
                konkursi: resultK.rows,
                poruke: resultPoruke.rows,
                porukeHr: resultPorukeHr.rows,
                documents: resultDocs.rows[0],
            });
        } else {
            res.status(404).send("User not found");
        }
    } catch (error) {
        console.error("Error fetching user data: ", error);
        next(error);
    }
}

const downloadFile = async (req, res, next) => {
    const { type, id } = req.params;

    // Validate the type
    if (!["cv", "pm", "certifikat", "preporuke"].includes(type)) {
        return res.status(400).send("Invalid document type.");
    }

    try {
        // Use parameterized query for id and dynamically insert column name
        const query = `SELECT ${type} FROM kandidat_dokument WHERE kandidat_id = $1;`;
        const result = await pool.query(query, [id]);

        // Check if the file exists
        if (result.rows.length === 0 || !result.rows[0][type]) {
            return res.status(404).send("File not found.");
        }

        const filePath = result.rows[0][type];

        // Send file as attachment
        res.download(filePath, `${type}.pdf`, (err) => {
            if (err) {
                console.error("Error sending file:", err);
                res.status(500).send("Error sending file.");
            }
        });
    } catch (error) {
        console.error("Error downloading file: ", error);
        res.status(500).send("Internal server error.");
    }
}

const DeleteRadnoIskustvo = async (req, res, next) => {
    try{
        const {id} = req.params;

        const querry = "DELETE FROM kandidat_radno_iskustvo WHERE id = $1 RETURNING *";
        const result = await pool.query(querry, [id]);
        res.redirect("/users/home");
    }catch (error) {
        console.error("Error downloading file: ", error);
        res.status(500).send("Internal server error.");
    }
}

const KonkursDetails = async (req, res, next) => {
    const idKonkursa = req.params.id;
    try {
        const query = 'SELECT kk.statusK, k.* FROM konkurs k ' +
            'INNER JOIN konkurs_kandidat kk ON kk.konkurs_id = k.id' +
            ' WHERE k.id = $1 AND kk.kandidat_id = (SELECT id FROM kandidat WHERE email = $2);';
        const result = await pool.query(query, [idKonkursa, res.userData.email]);

        if (result.rows.length === 0) {
            return res.status(404).send('Konkurs not found');
        }

        res.render('user/konkursDetails', {
            konkurs: result.rows,
        });
    } catch (error) {
        console.error('Error fetching konkurs details:', error);
        next(error);
    }
}

const DeleteEducation = async (req, res, next) => {
    try{
        const {id} = req.params;

        const querry = "DELETE FROM kandidat_obrazovanje WHERE id = $1 RETURNING *";
        const result = await pool.query(querry, [id]);
        res.redirect("/users/home");
    }catch (error) {
        console.error("Error downloading file: ", error);
        res.status(500).send("Internal server error.");
    }
}

const DeleteExp = async (req, res, next) => {
    try{
        const {id} = req.params;

        const querry = "DELETE FROM kandidat_vjestine WHERE id = $1 RETURNING *";
        const result = await pool.query(querry, [id]);
        res.redirect("/users/home");
    }catch (error) {
        console.error("Error downloading file: ", error);
        res.status(500).send("Internal server error.");
    }
}

const DodajRadnoIskustvo = async (req, res, next) => {
    try{
        const query = "INSERT INTO kandidat_radno_iskustvo (kandidat_id, naziv_kompanije, datum_pocetka, datum_zavrsetka, opis) " +
            "VALUES ((SELECT id FROM kandidat WHERE email = $1), $2, $3, $4, $5) " +
            "RETURNING *;";
        const result = await pool.query(query, [res.userData.email,
            req.body.naziv_kompanije,
            req.body.pocetak_rada,
            req.body.zavrsetak_rada,
            req.body.opis]);

        if (result.rows.length > 0) {
            res.redirect('/users/home');
        } else {
            res.status(400).json({
                success: false,
                message: "Failed to add student"
            });
        }
    }catch (error) {
        console.error("Error downloading file: ", error);
        res.status(500).send("Internal server error.");
    }
}

const DodajRadnuVjestinu = async (req, res, next) => {
    try{
        const query = "INSERT INTO kandidat_vjestine (kandidat_id, naziv_vjestine, kolicina, opis) " +
            "VALUES ((SELECT id FROM kandidat WHERE email = $1), $2, $3, $4) " +
            "RETURNING *;";
        const result = await pool.query(query, [res.userData.email,
            req.body.naziv_vjestine,
            req.body.kolicina,
            req.body.opis]);

        if (result.rows.length > 0) {
            res.redirect('/users/home');
        } else {
            res.status(400).json({
                success: false,
                message: "Failed to add student"
            });
        }
    }catch (error) {
        console.error("Error downloading file: ", error);
        res.status(500).send("Internal server error.");
    }
}

const DodajObrazovanje = async (req, res, next) => {
    try{
        const query = "INSERT INTO kandidat_obrazovanje (kandidat_id, strucna_sprema, naziv_ustanove, pocetak_pohadzanja, kraj_pohadzanja) " +
            "VALUES ((SELECT id FROM kandidat WHERE email = $1), $2, $3, $4, $5) " +
            "RETURNING *;";
        const result = await pool.query(query, [res.userData.email,
            req.body.strucna_sprema,
            req.body.naziv_ustanove,
            req.body.pocetak_pohadzanja,
            req.body.kraj_pohadzanja]);

        if (result.rows.length > 0) {
            res.redirect('/users/home');
        } else {
            res.status(400).json({
                success: false,
                message: "Failed to add student"
            });
        }
    }catch (error) {
        console.error("Error downloading file: ", error);
        res.status(500).send("Internal server error.");
    }
}

const UpdateOMeni = async (req, res, next) => {
    try{
        const userId = req.params.id;
        const {adresa, opis } = req.body;
        const query = 'UPDATE kandidat_licni_podaci SET ' +
            'adresa_stanovanja = $1, o_meni = $2 WHERE kandidat_id = $3';

        await pool.query(query, [adresa, opis, userId]);

        res.redirect("/users/home");

    }
    catch (error) {
        console.error("Error downloading file: ", error);
        res.status(500).send("Internal server error.");
    }
}

const PosaljiPoruku = async (req, res, next) => {
    try{
        if(req.body.primalac == "admin"){


            const query = "INSERT INTO poruke_kandidat_admin(ime, prezime, email, subject, poruka, kandidat_id)" +
                " VALUES($1, $2, $3, $4, $5, (SELECT id FROM kandidat WHERE email = $6));";

            const result = await pool.query(query, [
                req.body.ime,
                req.body.prezime,
                res.userData.email,
                req.body.svrha,
                req.body.poruka,
                res.userData.email
            ]);
        }
        else{
            const query = "INSERT INTO poruke_kandidat_hr(ime, prezime, email, subject, poruka, kandidat_id)" +
                " VALUES($1, $2, $3, $4, $5, (SELECT id FROM kandidat WHERE email = $6));";

            const result = await pool.query(query, [
                req.body.ime,
                req.body.prezime,
                res.userData.email,
                req.body.svrha,
                req.body.poruka,
                res.userData.email
            ]);
        }

        res.redirect('/users/contact');
    }catch (error) {
        console.error("Error downloading file: ", error);
        res.status(500).send("Internal server error.");
    }
}

const PogledajPoruku = async (req, res, next) => {
    try {
        const query = "SELECT * FROM poruke_kandidat_admin WHERE id = $1;";
        const result = await pool.query(query, [req.params.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Message not found" });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error("Error fetching message:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
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
}

