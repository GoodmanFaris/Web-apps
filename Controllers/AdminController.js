const pool = require("../Database/db");
const router = require("../routes");
const result = require("pg/lib/query");

const AdminHome = async(req, res, next) => {
    try {
        const queryK = "SELECT * FROM konkurs WHERE aktivan = 1;";
        const resultK = await pool.query(queryK);

        const queryPKA = "SELECT * FROM poruke_kandidat_admin ORDER BY datum DESC LIMIT 15;";
        const resultPKA = await pool.query(queryPKA);

        const queryK1 = "SELECT * FROM kandidat;";
        const resultK1 = await pool.query(queryK1);

        res.render('admin/home', {
            title: 'Express',
            konkursi: resultK.rows,
            poruke5: resultPKA.rows,
            kandidati: resultK1.rows,
        });
    } catch (error) {
        console.error("Error in fetching data for admin home:", error);
        res.status(500).send("Internal Server Error");
    }
}

const SaveKonkurs = async(req, res, next) => {
    try {
        const query = `
            INSERT INTO konkurs(
                naziv, opis, datum_isteka, naziv_kompanije, vrsta_posla, 
                obavezan_cv, obavezno_mp, obavezan_certifikat, obavezne_preporuke
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);
        `;

        const a = req.body.require_cv[req.body.require_cv.length - 1];
        const b = req.body.require_cover_letter[req.body.require_cover_letter.length - 1];
        const c = req.body.require_certificates[req.body.require_certificates.length - 1];
        const d = req.body.require_recommendations[req.body.require_recommendations.length - 1];

        console.log("BOF", a);

        const result = await pool.query(query, [
            req.body.job_title,
            req.body.job_desc,
            req.body.deadline,
            req.body.company_name,
            req.body.job_type,
            a,
            b,
            c,
            d
        ]);
        res.redirect('/admin');
    } catch (error) {
        console.error("Error inserting job into database:", error);
        res.status(500).send("Internal Server Error");
    }
}

const viewKonkurs = async(req, res, next) => {
    try {
        const { id } = req.params;

        const query = "SELECT * FROM konkurs WHERE id = $1";
        const result = await pool.query(query, [id]);

        const queryAllK = `
            SELECT k.*, kk.* 
            FROM kandidat k 
            INNER JOIN konkurs_kandidat kk 
            ON k.id = kk.kandidat_id 
            WHERE kk.konkurs_id = $1;
        `;
        const resultAllK = await pool.query(queryAllK, [id]);

        res.render('admin/viewKonkurs', {
            konkurs: result.rows,
            kandidati: resultAllK.rows,
        });
    } catch (error) {
        console.error("Error fetching konkurs and kandidati:", error);
        res.status(500).send("Internal Server Error");
    }
}

const StatusOdbijen = async(req, res, next) => {
    try {
        const { idU, idK } = req.params;

        const query = `
            UPDATE konkurs_kandidat 
            SET statusK = 'Odbijen' 
            WHERE kandidat_id = $1 AND konkurs_id = $2;
        `;
        await pool.query(query, [idU, idK]);

        res.redirect(`/admin/view/konkurs/${idK}`);
    } catch (error) {
        console.error("Error updating status to 'Odbijen':", error);
        res.status(500).send("Internal Server Error");
    }
}

const statusInterviju = async (req, res, next)=>{
    try {
        const {idU, idK} = req.params;
        const query = "UPDATE konkurs_kandidat SET statusK = 'interviju' WHERE kandidat_id = $1 AND konkurs_id = $2;";
        await pool.query(query, [idU, idK]);

        res.redirect(`/admin/view/konkurs/${idK}`);
    } catch (error) {
        console.error("Error updating status to 'Interviju':", error);
        res.status(500).send("Internal Server Error");
    }
}

const statusUziIzbor = async (req, res, next)=>{
    try {
        const {idU, idK} = req.params;
        const query = "UPDATE konkurs_kandidat SET statusK = 'Uži izbor' WHERE kandidat_id = $1 AND konkurs_id = $2;";
        await pool.query(query, [idU, idK]);

        res.redirect(`/admin/view/konkurs/${idK}`);
    } catch (error) {
        console.error("Error updating status to 'Uži izbor':", error);
        res.status(500).send("Internal Server Error");
    }
}

const statusPrihvacen = async(req, res, next)=>{
    try {
        const {idU, idK} = req.params;
        const query = "UPDATE konkurs_kandidat SET statusK = 'Prihvačen' WHERE kandidat_id = $1 AND konkurs_id = $2;";
        await pool.query(query, [idU, idK]);

        res.redirect(`/admin/view/konkurs/${idK}`);
    } catch (error) {
        console.error("Error updating status to 'Prihvačen':", error);
        res.status(500).send("Internal Server Error");
    }
}


const ViewKandidatKonkurs = async(req, res, next)=>{
    try {
        const { idKonkurs, idKandidat } = req.params;

        const query1 = "SELECT * FROM konkurs WHERE id = $1";
        const result = await pool.query(query1, [idKonkurs]);

        const queryKandidatMain = "SELECT * FROM kandidat WHERE id = $1;";
        const resultKandidatMain = await pool.query(queryKandidatMain, [idKandidat]);

        const queryKandidat = "SELECT * FROM kandidat_licni_podaci WHERE kandidat_id = $1;";
        const resultKandidat = await pool.query(queryKandidat, [idKandidat]);

        const queryKandidatObr = "SELECT * FROM kandidat_obrazovanje WHERE kandidat_id = $1;";
        const resultKandidatObr = await pool.query(queryKandidatObr, [idKandidat]);

        const queryKandidatExp = "SELECT * FROM kandidat_radno_iskustvo WHERE kandidat_id = $1;";
        const resultKandidatExp = await pool.query(queryKandidatExp, [idKandidat]);

        const queryKandidatSkill = "SELECT * FROM kandidat_vjestine WHERE kandidat_id = $1;";
        const resultKandidatSkill = await pool.query(queryKandidatSkill, [idKandidat]);

        const queryFiles = `
            SELECT cv, mp, certifikat, preporuka
            FROM konkurs_kandidat 
            WHERE kandidat_id = $1 AND konkurs_id = $2
        `;
        const resultFiles = await pool.query(queryFiles, [idKandidat, idKonkurs]);

        res.render('admin/viewUserKonkurs', {
            ime: resultKandidatMain.rows[0].ime,
            prezime: resultKandidatMain.rows[0].prezime,
            email: resultKandidatMain.rows[0].email,
            idUser: resultKandidatMain.rows[0].id,
            datum_rodjenja: resultKandidat.rows[0]?.datum_rodjenja,
            adresa: resultKandidat.rows[0]?.adresa_stanovanja,
            opis: resultKandidat.rows[0]?.o_meni,
            iskustvo: resultKandidatExp.rows,
            vjestine: resultKandidatSkill.rows,
            obrazovanje: resultKandidatObr.rows,
            konkursi: result.rows,
            files: resultFiles.rows[0],
            idKandidat: idKandidat,
        });
    } catch (error) {
        console.error("Error viewing konkurs and kandidat details:", error);
        res.status(500).send("Internal Server Error");
    }
}

const scheduleInterview = async(req, res, next) => {
    try {
        const {idU, idK} = req.params;
        const query = "UPDATE konkurs_kandidat SET statusK = 'Interviju', datum_intervijua = $1 WHERE kandidat_id = $2 AND konkurs_id = $3;";
        await pool.query(query, [req.body.interviewDate, idU, idK]);

        res.redirect(`/admin/view/konkurs/${idK}`);
    } catch (error) {
        console.error("Error scheduling interview:", error);
        res.status(500).send("Internal Server Error");
    }
}

const critique = async(req, res, next) => {
    try {
        const { id, idKonk } = req.params;

        const query = `
            INSERT INTO kandidat_komentar_ocjena(kandidat_id, komentar, ocjena) 
            VALUES ($1, $2, $3) RETURNING *;
        `;
        const result = await pool.query(query, [id, req.body.komentar, req.body.ocjena]);

        const queryOcj = `
            UPDATE konkurs_kandidat 
            SET ocijenjen = 1 
            WHERE kandidat_id = $1 AND konkurs_id = $2;
        `;
        const resultOcj = await pool.query(queryOcj, [id, idKonk]);

        res.redirect(`/admin/view/konkurs/${idKonk}`);
    } catch (err) {
        console.error("Error adding comment and updating candidate status:", err);
        res.status(500).send("Internal Server Error");
    }
}

const dashboard = async(req, res, next)=>{
    try {
        const queryKonkursi = `
      SELECT k.id, k.naziv, k.datum_isteka, 
             COUNT(kk.kandidat_id) AS broj_kandidata
      FROM konkurs k
      LEFT JOIN konkurs_kandidat kk ON k.id = kk.konkurs_id
      GROUP BY k.id
      ORDER BY k.datum_isteka ASC;
    `;
        const result = await pool.query(queryKonkursi);


        res.render('admin/dashboard', { konkursi: result.rows });
    } catch (err) {
        console.error('Error fetching dashboard data:', err);
        res.status(500).send('Internal Server Error');
    }
}

const dashboardKonkurs = async(req, res, next) => {
    const { id } = req.params;
    try {
        const queryCandidates = `
            SELECT 
                c.ime, 
                c.prezime, 
                c.email, 
                kco.ocjena, 
                kco.komentar
            FROM kandidat c
            INNER JOIN konkurs_kandidat kk ON c.id = kk.kandidat_id
            INNER JOIN kandidat_komentar_ocjena kco ON c.id = kco.kandidat_id
            WHERE kk.konkurs_id = $1
            ORDER BY kco.ocjena DESC NULLS LAST;
        `;
        const result = await pool.query(queryCandidates, [id]);

        // Render the candidate view
        res.render('admin/konkurs_kandidati', {
            kandidati: result.rows,
            konkursId: id,
        });
    } catch (err) {
        console.error('Error fetching candidates:', err);
        res.status(500).send('Internal Server Error');
    }
}

const critiqueUser = async(req, res, next) => {
    const {id} = req.params;
    try{
    const query = 'INSERT INTO kandidat_komentar_ocjena(kandidat_id, komentar, ocjena) VALUES' +
        '($1, $2, $3) RETURNING *;';
    const result = await pool.query(query, [id, req.body.komentar, req.body.ocjena]);

    const queryOcj = "UPDATE konkurs_kandidat SET ocijenjen = 1 WHERE kandidat_id = $1;";
    const resultOcj = await pool.query(queryOcj, [id]);

    res.redirect('/admin/all-users');
    }catch (err) {
        console.error('Error fetching candidates:', err);
        res.status(500).send('Internal Server Error');
    }
}

const MessageResponse = async (req, res, next)=>{
    try{
        const {id} = req.params;
        const query = 'UPDATE poruke_kandidat_admin SET odgovor = $1, odgovoreno = 1 WHERE id = $2;';
        const result = await pool.query(query, [req.body.odgovor, id]);


        res.redirect('/admin/all-messages');
    }
    catch (err) {
        console.error('Error fetching candidates:', err);
        res.status(500).send('Internal Server Error');
    }
}

const MessageResponseHR = async(req, res, next)=>{
    try{
    const {id} = req.params;
    const query = 'UPDATE poruke_hr_admin SET odgovor = $1, odgovoreno = 1 WHERE id = $2;';
    const result = await pool.query(query, [req.body.odgovor, id]);


    res.redirect('/admin/all-messages');
    }catch (err) {
        console.error('Error fetching candidates:', err);
        res.status(500).send('Internal Server Error');
    }
}

const SendMessage = async(req, res, next)=>{
    try{
        const { email, message } = req.body;

        let query = '';

        if (email.includes('@HR.com')) {
            query = 'INSERT INTO poruke_hr_admin (email, poruka) VALUES ($1, $2)';
        } else {
            query = 'INSERT INTO poruke_kandidat_admin (email, poruka) VALUES ($1, $2)';
        }

        const result = await pool.query(query, [email, message]);

        res.redirect('/admin/');

    }catch (err) {
        console.error('Error fetching candidates:', err);
        res.status(500).send('Internal Server Error');
    }
}

const DeleteKonkurs = async(req, res, next)=>{
    try {
        const {id} = req.params;
        const querry = 'UPDATE konkurs SET aktivan = 0 WHERE id = $1 RETURNING *;';
        const result = await pool.query(querry, [id]);
        res.redirect("/admin");
    }catch (err) {
        console.error('Error fetching candidates:', err);
        res.status(500).send('Internal Server Error');
    }
}

const ViewAllKonkurs = async(req, res, next)=>{
    try{
        const query = "SELECT * FROM konkurs ORDER BY aktivan DESC;";
        const result = await pool.query(query);

        res.render('admin/viewAllKonkurs',{
            konkursi: result.rows,
        });
    }catch (err) {
        console.error('Error fetching candidates:', err);
        res.status(500).send('Internal Server Error');
    }
}

const ViewAllKonkursSorted1 = async(req, res, next)=>{
    try{
        const query = "SELECT * FROM konkurs ORDER BY naziv_kompanije DESC;";
        const result = await pool.query(query);

        res.render('admin/viewAllKonkurs',{
            konkursi: result.rows,
        });
    }catch (err) {
        console.error('Error fetching candidates:', err);
        res.status(500).send('Internal Server Error');
    }
}

const ViewAllKonkursSorted2 = async(req, res, next)=>{
    try {
        const query = "SELECT * FROM konkurs ORDER BY datum_isteka DESC;";
        const result = await pool.query(query);

        res.render('admin/viewAllKonkurs',{
            konkursi: result.rows,
        });
    }catch (err) {
        console.error('Error fetching candidates:', err);
        res.status(500).send('Internal Server Error');
    }
}

const ViewAllKonkursSorted3 = async(req, res, next)=>{
    try{
        const query = "SELECT      k.*,      COUNT(kk.konkurs_id) AS broj_kandidata FROM      konkurs k LEFT JOIN      konkurs_kandidat kk  ON      k.id = kk.konkurs_id GROUP BY      k.id ORDER BY      broj_kandidata DESC; ";
        const result = await pool.query(query);

        res.render('admin/viewAllKonkurs',{
            konkursi: result.rows,
        });
    }catch (err) {
        console.error('Error fetching candidates:', err);
        res.status(500).send('Internal Server Error');
    }
}

const AllMessages = async(req, res, next)=>{
    try {
        const query = "SELECT * FROM poruke_kandidat_admin WHERE odgovoreno = 0 ORDER BY datum DESC;";
        const result = await pool.query(query);

        const query1 = "SELECT * FROM poruke_hr_admin WHERE odgovoreno = 0 ORDER BY datum DESC;";
        const result1 = await pool.query(query1);

        res.render('admin/all_messages', {
            title: 'Poruke',
            messages: result.rows,
            messages1:result1.rows,
        });
    } catch (err) {
        console.error("Error fetching all messages:", err);
        res.status(500).send("Internal Server Error");
    }
}

const AllMessagesSorted1 = async(req, res, next)=>{
    try {
        const query = "SELECT * FROM poruke_kandidat_admin ORDER BY ime DESC;";
        const result = await pool.query(query);

        const query1 = "SELECT * FROM poruke_hr_admin ORDER BY email DESC;";
        const result1 = await pool.query(query1);

        res.render('admin/all_messages', {
            title: 'Poruke',
            messages: result.rows,
            messages1:result1.rows,
        });
    } catch (err) {
        console.error("Error fetching all messages:", err);
        res.status(500).send("Internal Server Error");
    }
}

const AllMessagesSorted2 = async(req, res, next)=>{
    try {
        const query = "SELECT * FROM poruke_kandidat_admin ORDER BY datum DESC;";
        const result = await pool.query(query);

        const query1 = "SELECT * FROM poruke_hr_admin ORDER BY datum DESC;";
        const result1 = await pool.query(query1);

        res.render('admin/all_messages', {
            title: 'Poruke',
            messages: result.rows,
            messages1:result1.rows,
        });
    }catch (err) {
        console.error("Error fetching all messages:", err);
        res.status(500).send("Internal Server Error");
    }
}

const AllMessagesSorted3 = async(req, res, next)=>{
    try {
        const query = "SELECT * FROM poruke_kandidat_admin ORDER BY subject DESC;";
        const result = await pool.query(query);

        res.render('admin/all_messages', {
            title: 'Poruke',
            messages: result.rows,
        });
    } catch (err) {
        console.error("Error fetching all messages:", err);
        res.status(500).send("Internal Server Error");
    }
}

const ViewMessageUsers = async(req, res, next)=>{
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

const ViewMessageHR = async(req, res, next)=>{
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

const viewAllUsers = async(req, res, next)=>{
    try {
        const query = "SELECT * FROM kandidat ORDER BY email DESC;";
        const result = await pool.query(query);

        const queryOcj = `
            SELECT k.ime, k.prezime, ko.ocjena
            FROM kandidat_komentar_ocjena ko
            JOIN kandidat k ON ko.kandidat_id = k.id 
            ORDER BY ocjena DESC;
        `;
        const resultOcj = await pool.query(queryOcj);

        res.render('admin/viewUsers', {
            title: 'Kandidati',
            kandidati: result.rows,
            ocjene: resultOcj.rows,
        });
    } catch (err) {
        console.error("Error fetching all messages:", err);
        res.status(500).send("Internal Server Error");
    }
}

const viewAllUsersSorted1 = async(req, res, next)=>{
    try {
        const query = "SELECT * FROM kandidat ORDER BY ime DESC;";
        const result = await pool.query(query);

        const queryOcj = `
            SELECT k.ime, k.prezime, ko.ocjena
            FROM kandidat_komentar_ocjena ko
            JOIN kandidat k ON ko.kandidat_id = k.id 
            ORDER BY ocjena DESC;
        `;
        const resultOcj = await pool.query(queryOcj);

        res.render('admin/viewUsers', {
            title: 'Kandidati',
            kandidati: result.rows,
            ocjene: resultOcj.rows,
        });
    } catch (err) {
        console.error("Error fetching all messages:", err);
        res.status(500).send("Internal Server Error");
    }
}

const viewAllUsersSorted2 = async(req, res, next)=>{
    try {
        const query = "SELECT * FROM kandidat ORDER BY prezime DESC;";
        const result = await pool.query(query);

        const queryOcj = `
            SELECT k.ime, k.prezime, ko.ocjena
            FROM kandidat_komentar_ocjena ko
            JOIN kandidat k ON ko.kandidat_id = k.id 
            ORDER BY ocjena DESC;
        `;
        const resultOcj = await pool.query(queryOcj);

        res.render('admin/viewUsers', {
            title: 'Kandidati',
            kandidati: result.rows,
            ocjene: resultOcj.rows,
        });
    } catch (err) {
        console.error("Error fetching all messages:", err);
        res.status(500).send("Internal Server Error");
    }
}

const viewUser = async(req, res, next)=>{
    try{
        const {id} = req.params;

        const queryKandidatMain = "SELECT * FROM kandidat WHERE id = $1;";
        const resultKandidatMain = await pool.query(queryKandidatMain, [id]);

        const queryKandidat = "SELECT * FROM kandidat_licni_podaci WHERE kandidat_id = $1;";
        const resultKandidat = await pool.query(queryKandidat, [id]);

        const queryKandidatObr = "SELECT * FROM kandidat_obrazovanje WHERE kandidat_id = $1;";
        const resultKandidatObr = await pool.query(queryKandidatObr, [id]);

        const queryKandidatExp = "SELECT * FROM kandidat_radno_iskustvo WHERE kandidat_id = $1;";
        const resultKandidatExp = await pool.query(queryKandidatExp, [id]);

        const queryKandidatSkill = "SELECT * FROM kandidat_vjestine WHERE kandidat_id = $1;";
        const resultKandidatSkill = await pool.query(queryKandidatSkill, [id]);

        const queryKandidatOcj = "SELECT * FROM kandidat_komentar_ocjena WHERE kandidat_id = $1;";
        const resultKandidatOcj = await pool.query(queryKandidatOcj, [id]);



        res.render('admin/viewUser', {
            ime: resultKandidatMain.rows[0].ime,
            prezime: resultKandidatMain.rows[0].prezime,
            email: resultKandidatMain.rows[0].email,
            idUser: resultKandidatMain.rows[0].id,
            datum_rodjenja: resultKandidat.rows[0]?.datum_rodjenja, // Dodajte [0]
            adresa: resultKandidat.rows[0]?.adresa_stanovanja, // Dodajte [0]
            opis: resultKandidat.rows[0]?.o_meni, // Dodajte [0]
            iskustvo: resultKandidatExp.rows,
            vjestine: resultKandidatSkill.rows,
            obrazovanje: resultKandidatObr.rows,
            konkursi: result.rows,
            test2: id,
            ocjenaKom: resultKandidatOcj.rows,
        });
    }catch (err) {
        console.error("Error fetching all messages:", err);
        res.status(500).send("Internal Server Error");
    }
}





module.exports = {
    AdminHome,
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
};