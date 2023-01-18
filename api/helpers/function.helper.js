const validateAccess  = (rolesList, userRole) => rolesList.find(role => role == userRole);

const getDateRangeOfWeek = (num_sem_souhaitee, num_sem_actuelle) => {
    let date = new Date();

    let nbr_jour_depuis_debut_semaine = eval(date.getDay()- 1);
    date.setDate(date.getDate() - nbr_jour_depuis_debut_semaine);

    let sem_futurs = eval( num_sem_souhaitee - num_sem_actuelle );
    date.setDate(date.getDate() + eval( 7 * sem_futurs ));

    let date_debut = date.getFullYear() + "-" + eval(date.getMonth()+1) + "-" + date.getDate();
    date.setDate(date.getDate() + 6);

    let date_fin = date.getFullYear() + "-" + eval(date.getMonth()+1) +"-" + date.getDate();

    return {"date_debut" : date_debut, "date_fin" : date_fin}
}

module.exports ={
    validateAccess      : validateAccess        ,
    getDateRangeOfWeek  : getDateRangeOfWeek
}