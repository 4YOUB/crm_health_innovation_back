const { workerData, parentPort } = require('worker_threads')
const moment = require('moment')
let visites = workerData?.v
let produits = workerData.p
let visitesLength = visites?.length
let filteredVisites = []
for (let ind = 0; ind < visitesLength; ind++) {
    i = filteredVisites.findIndex(el => el.id_visite == visites[ind].id_visite)

    if (i === -1) {
        let produits_filtered = produits.filter(prod => prod.id_visite == visites[ind].id_visite)
        let products = {}
        let productsLength = produits_filtered?.length
        for (let inde = 0; inde < productsLength; inde++) {
            inx = inde + 1
            products['nom_produit' + inx] = produits_filtered[inde].produit
            products['gamme_produit' + inx] = produits_filtered[inde].gamme
            products['nbr_echantillon' + inx] = produits_filtered[inde].nbr_echantillon
        }

        filteredVisites.push({
            id_visite: visites[ind].id_visite,
            accompagnant: visites[ind].accompagnant,
            code_statut_visite: visites[ind].code_statut_visite,
            Status: visites[ind].Status,
            code_type_visite: visites[ind].code_type_visite,
            date_replanification: visites[ind].date_replanification,
            date_visite: moment(visites[ind].date_visite, 'YYYY-MM-DD HH:mm:ss').format('YYYY-MM-DD'),
            heure_debut_visite: moment(visites[ind].date_visite, 'YYYY-MM-DD HH:mm:ss').format('HH:mm:ss'),
            heure_fin_visite: visites[ind].heure_fin_visite,
            flag_accompagnee: visites[ind].flag_accompagnee,
            id_utilisateur: visites[ind].id_utilisateur,
            nom_utilisateur: visites[ind].nom_utilisateur,
            nbr_produit: visites[ind].nbr_produit,
            type_visite: visites[ind].type_visite,
            nbr_comptes: 0,
            ...products
        })
    }
    i = i === -1 ? filteredVisites.length - 1 : i
    filteredVisites[i]['id_partenaires' + visites[ind].order] = visites[ind].id_partenaires
    filteredVisites[i]['code_potentiel' + visites[ind].order] = visites[ind].code_potentiel
    filteredVisites[i]['code_specialite' + visites[ind].order] = visites[ind].code_specialite
    filteredVisites[i]['code_type_partenaire' + visites[ind].order] = visites[ind].code_type_partenaire
    filteredVisites[i]['nom_partenaire' + visites[ind].order] = visites[ind].nom_partenaire
    filteredVisites[i]['specialite' + visites[ind].order] = visites[ind].specialite
    filteredVisites[i]['type_partenaire' + visites[ind].order] = visites[ind].type_partenaire
    filteredVisites[i]['nbr_comptes'] += 1
}

parentPort.postMessage(filteredVisites)