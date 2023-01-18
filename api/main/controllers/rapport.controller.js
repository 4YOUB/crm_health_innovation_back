const rapport_model = require('../models/rapport.model');
const jwt_decode = require('jwt-decode');
const { validateAccess } = require('../../helpers/function.helper');
const mysql = require('mysql');
const moment = require('moment')
const excelJs = require("exceljs");
const fs = require("fs");
exports.get_rapport_annuel = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['ADMI', 'ACH', 'DIR', 'DRG', 'PM', 'DSM', 'KAM', 'DEL'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let {
        annee,
        id_utilisateur
    } = { ...req.body };

    if (annee == null) {
        annee = new Date().getFullYear();
    }

    let query = mysql.format(rapport_model.que_get_evenements_global, [annee]);

    connection.query(query + rapport_model.que_get_params, (err, result) => {
        if (!err) {
            const liste_evenements = result[result.length - 5];
            const flag_dimanche = result[result.length - 3][0].flag_dimanche;
            const flag_samedi = result[result.length - 4][0].flag_samedi;
            const type_journee_dimanche = result[result.length - 3][0].type_journee_dimanche;
            const type_journee_samedi = result[result.length - 4][0].type_journee_samedi;
            const heure_debut_journee = result[result.length - 2][0].heure_debut_journee;
            const heure_fin_journee = result[result.length - 1][0].heure_fin_journee;

            let liste_mois = [];
            for (i = 0; i < 12; i++) {
                let nbr_jours_mois = new Date(annee, i + 1, 0).getDate();
                let nbr_samedi = sunsatInMonth(6, i, annee);
                let nbr_dimanche = sunsatInMonth(0, i, annee);
                let nbr_samedi_ouvrables = flag_samedi == 'O' ? (
                    type_journee_samedi == 'TOJO' ? nbr_samedi : (nbr_samedi / 2)
                ) : 0;
                let nbr_dimanche_ouvrables = flag_dimanche == 'O' ? (
                    type_journee_dimanche == 'TOJO' ? nbr_dimanche : (nbr_dimanche / 2)
                ) : 0;
                liste_mois.push({
                    mois: i + 1,
                    nbr_jours_ouvrables: nbr_jours_mois - nbr_samedi_ouvrables - nbr_dimanche_ouvrables
                });
            }

            connection.query(rapport_model.que_get_rapport_annuel, [
                bearer_content.id_utilisateur,
                bearer_content.role,
                annee,
                heure_debut_journee,
                heure_fin_journee,
                id_utilisateur
            ], (err, result) => {
                if (!err) {
                    let statistiques = result[result.length - 1];
                    for (i = 0; i < statistiques.length; i++) {
                        let date_creation = new Date(statistiques[i].date_creation);
                        let date_visite = new Date(statistiques[i].date_visite);
                        if (date_creation.getDate() != 1 && date_creation.getMonth() == date_visite.getMonth() && date_creation.getFullYear() == date_visite.getFullYear()) {
                            let nbr_samedi = sunsatInMonth(6, date_creation.getMonth(), annee);
                            let nbr_dimanche = sunsatInMonth(0, date_creation.getMonth(), annee);
                            let nbr_samedi_ouvrables = flag_samedi == 'O' ? (
                                type_journee_samedi == 'TOJO' ? nbr_samedi : (nbr_samedi / 2)
                            ) : 0;
                            let nbr_dimanche_ouvrables = flag_dimanche == 'O' ? (
                                type_journee_dimanche == 'TOJO' ? nbr_dimanche : (nbr_dimanche / 2)
                            ) : 0;
                            statistiques[i].nbr_jours_nonTravaille = statistiques[i].nbr_evenements + nbr_samedi_ouvrables + nbr_dimanche_ouvrables;
                        }
                    };

                    const response = {
                        jours_par_mois: liste_mois,
                        liste_evenements_globals: liste_evenements,
                        statistiques: statistiques
                    }
                    return res.status(200).json(response).end();
                } else {
                    return res.status(500).json(err);
                }
            });
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.get_rapport_annee_existe = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['ADMI', 'ACH', 'DIR', 'DRG', 'PM', 'DSM', 'KAM', 'DEL'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    connection.query(rapport_model.que_get_rapport_anneeExiste, (err, result) => {
        if (!err) {
            return res.status(200).json({ annees: result.map(annee => annee.annees) }).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.get_sub_users = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const roles = ['ADMI', 'ACH', 'DIR', 'DRG', 'PM', 'DSM', 'KAM', 'DEL'];
    if (!validateAccess(roles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }
    let all = req.body.all || 0,
        user_id = req.body.id_utilisateur || bearer_content.id_utilisateur,
        role = bearer_content.role

    connection.query(rapport_model.que_get_sub_users, [user_id, role, all], (err, result) => {
        if (!err) {
            return res.status(200).json({ sub: result[result.length - 2] }).end();
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.test_annuel = (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const acceptedroles = ['ADMI', 'ACH', 'DIR', 'DRG', 'PM', 'DSM', 'KAM', 'DEL'];
    if (!validateAccess(acceptedroles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }

    let {
        annee,
        id_utilisateur,
        roles
    } = { ...req.body };

    connection.query(rapport_model.que_get_params, (err, result) => {
        if (!err) {
            const flag_dimanche = result[result.length - 3][0].flag_dimanche;
            const flag_samedi = result[result.length - 4][0].flag_samedi;
            const type_journee_dimanche = result[result.length - 3][0].type_journee_dimanche;
            const type_journee_samedi = result[result.length - 4][0].type_journee_samedi;

            let liste_mois = [];
            for (i = 0; i < 12; i++) {

                let nbr_jours_mois = new Date(annee || moment().format('YYYY'), i + 1, 0).getDate();
                let nbr_samedi = sunsatInMonth(6, i, annee || moment().format('YYYY'));
                let nbr_dimanche = sunsatInMonth(0, i, annee || moment().format('YYYY'));
                let today = Number(moment().format('DD'));
                let nbr_samedi_ouvrables = flag_samedi == 'O' ? (
                    type_journee_samedi == 'TOJO' ? nbr_samedi : (nbr_samedi / 2)
                ) : 0;
                let nbr_dimanche_ouvrables = flag_dimanche == 'O' ? (
                    type_journee_dimanche == 'TOJO' ? nbr_dimanche : (nbr_dimanche / 2)
                ) : 0;
                let nbr_dimanche_jours_passe = flag_dimanche == 'O' ? (
                    type_journee_dimanche == 'TOJO' ? sunsatInMonth(0, i, annee || moment().format('YYYY'), today) : (sunsatInMonth(0, i, annee || moment().format('YYYY'), today) / 2)
                ) : 0;

                let nbr_samedi_jours_passe = flag_samedi == 'O' ? (
                    type_journee_samedi == 'TOJO' ? sunsatInMonth(6, i, annee || moment().format('YYYY'), today) : (sunsatInMonth(6, i, annee || moment().format('YYYY'), today) / 2)
                ) : 0;
                liste_mois.push({
                    mois: i + 1,
                    nbr_jours_ouvrables: nbr_jours_mois - nbr_samedi_ouvrables - nbr_dimanche_ouvrables,
                    jours_passe: moment().format('YYYY-MM-DD') == moment().year(annee || moment().format('YYYY')).month(i).format('YYYY-MM-DD') ? today - nbr_samedi_jours_passe - nbr_dimanche_jours_passe : moment().isBefore(moment().year(annee || moment().format('YYYY')).month(i).set('D', 1)) ? 0 : nbr_jours_mois - nbr_samedi_ouvrables - nbr_dimanche_ouvrables
                });
            }
            roles = roles?.length > 0 ? roles : acceptedroles
            connection.query(rapport_model.test_annuel, [id_utilisateur || bearer_content.id_utilisateur, annee || moment().format('YYYY'), roles, roles, roles, roles, roles, roles], (err, result) => {
                if (!err) {
                    return res.status(200).json({ nbr_jours_ouvrables: liste_mois, statistiques: result[result.length - 3], liste_evenements_globals: result[6][0] }).end();
                } else {
                    return res.status(500).json(err);
                }
            })
        } else {
            return res.status(500).json(err);
        }
    })
}

exports.export_taux_coverture = async (req, res) => {
    const bearer = req.headers.authorization.split(' ')[1];
    let bearer_content = {};
    try {
        bearer_content = jwt_decode(bearer);
    } catch {
        return res.status(400).json({
            error: 'the token is not valid'
        });
    }

    const acceptedroles = ['ADMI', 'ACH', 'DIR', 'DRG', 'PM', 'DSM', 'KAM', 'DEL'];
    if (!validateAccess(acceptedroles, bearer_content.role)) {
        return res.status(200).json({ message: "Sorry, you're not authorized to use this API" }).end();
    }
    const totalData = req.body.totalData || [],
        delegueData = req.body.delegueData.length > 0 ? req.body.delegueData : [[['-'], ['-'], ['-'], ['-'], ['-'], ['-']]],
        isReduit = req.body.isReduit,
        nom_utilisateur = req.body.responsable,
        annee = req.body.annee
    try {
        var dir = './temp_exports';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }

        const workbook = new excelJs.Workbook();  // Create a new workbook  
        const worksheet = workbook.addWorksheet("Total Taux de Coverture"); // New Worksheet  
        const rows = [], delegueRow = []
        worksheet.getCell('B1').value = `Équipe de : ${nom_utilisateur}`
        worksheet.getCell('B1').border = {
            'left': { style: 'thin' }, 'bottom': { style: 'thin' }, 'right': { style: 'thin' }
        }
        worksheet.getCell('B1').font = { bold: true, size: '12' }
        worksheet.getCell('C1').value = `Année : ${annee}`
        worksheet.getCell('C1').border = {
            'left': { style: 'thin' }, 'bottom': { style: 'thin' }, 'right': { style: 'thin' }
        }
        worksheet.getCell('C1').font = { bold: true, size: '12' }
        Object.keys(totalData).forEach((key) => {
            rows.push([
                key,
                totalData['Délégués actifs']?.Janvier ? totalData[key]?.Janvier : '-',
                totalData['Délégués actifs']?.Fevrier ? totalData[key]?.Fevrier : '-',
                totalData['Délégués actifs']?.Mars ? totalData[key]?.Mars : '-',
                totalData['Délégués actifs']?.Avril ? totalData[key]?.Avril : '-',
                totalData['Délégués actifs']?.May ? totalData[key]?.May : '-',
                totalData['Délégués actifs']?.Juin ? totalData[key]?.Juin : '-',
                totalData['Délégués actifs']?.Juillet ? totalData[key]?.Juillet : '-',
                totalData['Délégués actifs']?.Aout ? totalData[key]?.Aout : '-',
                totalData['Délégués actifs']?.Septembre ? totalData[key]?.Septembre : '-',
                totalData['Délégués actifs']?.Octobre ? totalData[key]?.Octobre : '-',
                totalData['Délégués actifs']?.Novembre ? totalData[key]?.Novembre : '-',
                totalData['Délégués actifs']?.Decembre ? totalData[key]?.Decembre : '-',
                totalData[key]?.Total,
            ]); // Add data in worksheet  
        });
        worksheet.getColumn('B').width = 35
        worksheet.getColumn('B').alignment = { horizontal: 'center', vertical: 'middle' }
        worksheet.getColumn('C').width = 30
        worksheet.getColumn('C').alignment = { horizontal: 'center', vertical: 'middle' }
        for (let colIndex = 4; colIndex < 18; colIndex++) {
            worksheet.getColumn(colIndex).width = 15
            worksheet.getColumn(colIndex).alignment = { horizontal: 'center', vertical: 'middle' }
        }
        worksheet.addTable({
            name: 'myTable',
            ref: 'C3',
            headerRow: true,
            style: {
                theme: 'TableStyleLight10',
                showRowStripes: true,
                showFirstColumn: true
            },
            columns: [
                { name: " " },
                { name: "Janvier" },
                { name: "Fevrier" },
                { name: "Mars" },
                { name: "Avril" },
                { name: "May" },
                { name: "Juin" },
                { name: "Juillet" },
                { name: "Aout" },
                { name: "Septembre" },
                { name: "Octobre" },
                { name: "Novembre" },
                { name: "Decembre" },
                { name: "Total" },
            ],
            rows: rows
        })
        const B4Cell = worksheet.getCell(`B4`)
        B4Cell.value = "TOTAL"
        B4Cell.border = { 'left': { style: 'thin', 'color': { 'argb': 'C0504D' } }, 'top': { style: 'thin', 'color': { 'argb': 'C0504D' } }, 'bottom': { style: 'thin', 'color': { 'argb': 'C0504D' } } }
        B4Cell.font = { bold: true }
        worksheet.mergeCells(`B4:B${4 + (isReduit ? 5 : 9)}`)
        let cellIndex = !isReduit ? 17 : 13
        let rowIndex = !isReduit ? 17 : 13
        delegueData.forEach((delegue, index) => {

            Object.keys(delegue).forEach((key) => {
                if (key != 'delegue_actifs' && key != 'Nombre de jours par mois' && key != 'date_creation' && key != "nom_delegue")
                    delegueRow.push([
                        key,
                        delegue['delegue_actifs']?.Janvier == 'O' ? delegue[key]?.Janvier || 0 : '-',
                        delegue['delegue_actifs']?.Fevrier == 'O' ? delegue[key]?.Fevrier || 0 : '-',
                        delegue['delegue_actifs']?.Mars == 'O' ? delegue[key]?.Mars || 0 : '-',
                        delegue['delegue_actifs']?.Avril == 'O' ? delegue[key]?.Avril || 0 : '-',
                        delegue['delegue_actifs']?.May == 'O' ? delegue[key]?.May || 0 : '-',
                        delegue['delegue_actifs']?.Juin == 'O' ? delegue[key]?.Juin || 0 : '-',
                        delegue['delegue_actifs']?.Juillet == 'O' ? delegue[key]?.Juillet || 0 : '-',
                        delegue['delegue_actifs']?.Aout == 'O' ? delegue[key]?.Aout || 0 : '-',
                        delegue['delegue_actifs']?.Septembre == 'O' ? delegue[key]?.Septembre || 0 : '-',
                        delegue['delegue_actifs']?.Octobre == 'O' ? delegue[key]?.Octobre || 0 : '-',
                        delegue['delegue_actifs']?.Novembre == 'O' ? delegue[key]?.Novembre || 0 : '-',
                        delegue['delegue_actifs']?.Decembre == 'O' ? delegue[key]?.Decembre || 0 : '-',
                        delegue[key]?.Total,
                        delegue[key]?.Moyenne,
                    ]); // Add data in worksheet  
            })
            const chosedCell = worksheet.getCell(`B${cellIndex}`)
            chosedCell.value = delegue?.nom_delegue
            chosedCell.border = { 'left': { style: 'thin', 'color': { 'argb': 'C0504D' } }, 'bottom': { style: 'thin', 'color': { 'argb': 'C0504D' } } }
            chosedCell.font = { bold: true }
            worksheet.mergeCells(`B${cellIndex}:B${cellIndex + 5}`)
            cellIndex += 6
            const chosedRange = selectRange(worksheet, `B${rowIndex}:Q${rowIndex + 5}`)
            chosedRange.forEach(cell => {
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: index % 2 == 0 ? 'E6E6E6' : 'FFFFFF' }
                }
            })
            rowIndex += 6
        })
        worksheet.addTable({
            name: 'myTable2',
            ref: `C${!isReduit ? 16 : 12}`,
            headerRow: true,
            style: {
                theme: 'TableStyleLight10',
                showRowStripes: true,
                showFirstColumn: true
            },
            columns: [
                { name: " " },
                { name: "Janvier" },
                { name: "Fevrier" },
                { name: "Mars" },
                { name: "Avril" },
                { name: "May" },
                { name: "Juin" },
                { name: "Juillet" },
                { name: "Aout" },
                { name: "Septembre" },
                { name: "Octobre" },
                { name: "Novembre" },
                { name: "Decembre" },
                { name: "Total" },
                { name: "Moyenne" },
            ],
            rows: delegueRow
        })
        // const tab = worksheet.getTable('myTable2')
        // tab.addRow([...rows[0], ''], 0)
        // tab.commit()
        const headerCell = worksheet.getCell(`B${isReduit ? 12 : 16}`)
        headerCell.value = 'Délégué'
        headerCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'C0504D' },
            bgColor: { argb: 'C0504D' }
        }
        headerCell.font = {
            color: { argb: 'FFFFFF' },
            bold: true
        }
        // worksheet.getTable().
        // Column for data in excel. key must match data key
        // worksheet.columns = [
        //     { header: "", key: "Designation", width: 30 },
        //     { header: "Janvier", key: "Janvier", width: 13 },
        //     { header: "Fevrier", key: "Fevrier", width: 13 },
        //     { header: "Mars", key: "Mars", width: 13 },
        //     { header: "Avril", key: "Avril", width: 13 },
        //     { header: "May", key: "May", width: 13 },
        //     { header: "Juin", key: "Juin", width: 13 },
        //     { header: "Juillet", key: "Juillet", width: 13 },
        //     { header: "Aout", key: "Aout", width: 13 },
        //     { header: "Septembre", key: "Septembre", width: 13 },
        //     { header: "Octobre", key: "Octobre", width: 13 },
        //     { header: "Novembre", key: "Novembre", width: 13 },
        //     { header: "Decembre", key: "Decembre", width: 13 },
        //     { header: "Total", key: "Total", width: 13 },
        // ];
        // Looping through data
        // Object.keys(data).forEach((key) => {
        //     worksheet.addRow({
        //         Designation: key,
        //         Janvier: data['Délégués actifs']?.Janvier ? data[key]?.Janvier : '-',
        //         Fevrier: data['Délégués actifs']?.Fevrier ? data[key]?.Fevrier : '-',
        //         Mars: data['Délégués actifs']?.Mars ? data[key]?.Mars : '-',
        //         Avril: data['Délégués actifs']?.Avril ? data[key]?.Avril : '-',
        //         May: data['Délégués actifs']?.May ? data[key]?.May : '-',
        //         Juin: data['Délégués actifs']?.Juin ? data[key]?.Juin : '-',
        //         Juillet: data['Délégués actifs']?.Juillet ? data[key]?.Juillet : '-',
        //         Aout: data['Délégués actifs']?.Aout ? data[key]?.Aout : '-',
        //         Septembre: data['Délégués actifs']?.Septembre ? data[key]?.Septembre : '-',
        //         Octobre: data['Délégués actifs']?.Octobre ? data[key]?.Octobre : '-',
        //         Novembre: data['Délégués actifs']?.Novembre ? data[key]?.Novembre : '-',
        //         Decembre: data['Délégués actifs']?.Decembre ? data[key]?.Decembre : '-',
        //         Total: data[key]?.Total,
        //     }); // Add data in worksheet  
        // });
        // Making first line in excel height = 20
        // worksheet.getRow(1).height = 20;
        // Making first line in excel bold and change color
        // worksheet.getRow(1).eachCell((cell) => {
        //     cell.font = {
        //         bold: true,
        //         color: { argb: '00ffffff' }
        //     };
        //     cell.fill = {
        //         type: 'pattern',
        //         pattern: 'solid',
        //         fgColor: { argb: '00aa182d' },
        //     };
        // });
        try {
            const path = `${dir}/${Date.now()}.xlsx`;
            const data = await workbook.xlsx.writeFile(path)
                .then(() => {
                    res.download(path, "total_taux_coverture.xlsx", (err) => {
                        if (!err) {
                            fs.unlink(path, () => { });
                        }
                        else {
                            return res.status(500).json({ message: "export download error" });
                        }
                    });
                });
        } catch (err) {
            return res.status(500).json({
                message: "export error",
            });
        }


    } catch (error) {
        console.log(error)
        return res.status(500).json(error);

    }
}

function sunsatInMonth(weekDayId, month, year, end = -1) {
    var day, counter, date;
    day = 1;
    counter = 0;
    date = new Date(year, month, day);
    while (date.getMonth() === month) {
        if (date.getDay() === weekDayId) {
            counter += 1;
        }
        day += 1;
        date = new Date(year, month, day);
        if (day == end) break;
    }
    return counter;
}

/**
 *
 * @param {Exceljs.Worksheet} sheet
 * @param {String} rangeCell
 * @returns Cell[] References
 */
const selectRange = (sheet, rangeCell) => {
    let [startCell, endCell] = rangeCell.split(':')

    let [endCellColumn, endRow] = endCell.match(/[a-z]+|[^a-z]+/gi)
    let [startCellColumn, startRow] = startCell.match(/[a-z]+|[^a-z]+/gi)

    let endColumn = sheet.getColumn(endCellColumn)
    let startColumn = sheet.getColumn(startCellColumn)

    if (!endColumn) throw new Error('End column not found')
    if (!startColumn) throw new Error('Start column not found')

    const endColumnNumber = endColumn.number
    const startColumnNumber = startColumn.number

    const cells = []
    for (let y = parseInt(startRow); y <= parseInt(endRow); y++) {
        const row = sheet.getRow(y)

        for (let x = startColumnNumber; x <= endColumnNumber; x++) {
            cells.push(row.getCell(x))
        }
    }

    return cells
}