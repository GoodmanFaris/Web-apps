var express = require('express');
const pool = require("../Database/db");
var router = express.Router();





const HRHome = async (req, res, next) => {
    try {
        const query = `
            SELECT * FROM kandidat k
            INNER JOIN konkurs_kandidat kk ON kk.kandidat_id = k.id
            INNER JOIN konkurs kon ON kon.id = kk.konkurs_id
            INNER JOIN kandidat_komentar_ocjena kkc ON kkc.kandidat_id = k.id
            WHERE kk.statusk = 'Interviju';
        `;
        const result = await pool.query(query);
        res.render('HR/HRmanagment', { konkursi: result.rows });
    } catch (error) {
        console.error('Error fetching candidates:', error);
        next(error);
    }
}

const OcjeniUser = async (req, res, next) => {
    try {
        const kandidatId = req.params.id;
        const { rating, komentar } = req.body;

        if (!rating || isNaN(rating) || rating < 1 || rating > 5) {
            return res.status(400).send('Invalid rating. Must be a number between 1 and 5.');
        }

        const query = `
            UPDATE kandidat_komentar_ocjena
            SET ocjena = $1, komentar = $2
            WHERE kandidat_id = $3
        `;
        await pool.query(query, [rating, komentar, kandidatId]);

        res.redirect('/HR');
    } catch (error) {
        console.error('Error submitting rating:', error);
        res.status(500).send('An error occurred while submitting the rating.');
    }
}

const PorukeUser = async (req, res, next) => {
    try {
        const query = "SELECT * FROM poruke_kandidat_hr ORDER BY datum DESC;";
        const result = await pool.query(query);

        res.render('HR/poruke', {
            title: 'Poruke',
            messages: result.rows,
        });
    } catch (err) {
        console.error("Error fetching all messages:", err);
        res.status(500).send("Internal Server Error");
    }
}

const PogledajPorukuUser = async (req, res, next) => {
    try {
        const query = "SELECT * FROM poruke_kandidat_hr WHERE id = $1;";
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

const OdgovorUser = async (req, res, next) => {
    try{
        const {id} = req.params;
        const query = 'UPDATE poruke_kandidat_hr SET odgovor = $1, odgovoreno = 1 WHERE id = $2;';
        const result = await pool.query(query, [req.body.odgovor, id]);


        res.redirect('/HR/poruke/users');
    }catch (err) {
        console.error("Error fetching message:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const PorukeAdmin = async (req, res, next) => {
    try {
        const query = "SELECT * FROM poruke_hr_admin ORDER BY datum DESC;";
        const result = await pool.query(query);

        res.render('HR/porukeAdmin', {
            title: 'Poruke',
            messages: result.rows,
        });
    } catch (err) {
        console.error("Error fetching all messages:", err);
        res.status(500).send("Internal Server Error");
    }
}

const PogledajPorukuAdmin = async (req, res, next) => {
    try {
        const query = "SELECT * FROM poruke_hr_admin WHERE id = $1;";
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

const OdgovorAdmin = async (req, res, next) => {
    try{
        const {id} = req.params;
        const query = 'UPDATE poruke_hr_admin SET odgovor = $1 WHERE id = $2;';
        const result = await pool.query(query, [req.body.odgovor, id]);


        res.redirect('/HR/poruke');
    }catch (err) {
        console.error("Error fetching message:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const PosaljiPoruku = async(req, res, next) => {
    try{
        const { kome, email, message } = req.body;
        if (kome === 'admin') {
            const hrMail = res.userData.email;
            const query = `
        INSERT INTO poruke_hr_admin (email, poruka)
        VALUES ($1, $2)
      `;
            await pool.query(query, [hrMail, message]);
            res.redirect('/HR/poruke/admin');
        }
        else if (kome === 'candidate') {
            const query = `
        INSERT INTO poruke_kandidat_hr (email, poruka)
        VALUES ($1, $2)
      `;
            await pool.query(query, [email, message]);
            res.redirect('/HR/poruke/users');
        }

    }catch (err) {
        console.error("Error fetching message:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = {
    PosaljiPoruku,
    OdgovorAdmin,
    PogledajPorukuAdmin,
    PorukeAdmin,
    OdgovorUser,
    PogledajPorukuUser,
    PorukeUser,
    OcjeniUser,
    HRHome
};