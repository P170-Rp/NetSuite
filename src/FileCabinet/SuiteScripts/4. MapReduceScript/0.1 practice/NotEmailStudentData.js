/**
 *@NApiVersion 2.1
 *@NScriptType MapReduceScript
 */
define(['N/file', 'N/log', 'N/search', 'N/query'],
    (file, log, search, query) => {

        function getInputData() {

            const sql = `
                SELECT  custrecord_bits_student_name, 
                custrecord_bits_previous_college_name,
                custrecord_bits_std_course,
                custrecord_bits_std_age, 
                custrecord_bits_std_gender, 
                custrecord126,
                custrecord_bits_std_phone
                FROM customrecord_bits_student_registration_f
                WHERE custrecord126 IS NULL OR custrecord126 = ''
                `;

            try {
                const sqlResult = query.runSuiteQL({ query: sql }).asMappedResults();

                log.debug("SQL Result Count", sqlResult.length);
                log.debug("First Record", sqlResult[0]);

                return sqlResult;

                
            } catch (err) {
                log.error("error: ", err);
            }
        }

        function map(mapcontext) {


            log.debug("Map Context Value", mapcontext.value);

            const data = JSON.parse(mapcontext.value);

            log.debug("Parsed Data", data);

            const course = data.custrecord_bits_std_course

            const obj = {

                student_name: data.custrecord_bits_student_name,

                previous_clg_name: data.custrecord_bits_previous_college_name,

                age: data.custrecord_bits_std_age,

                gender: data.custrecord_bits_std_gender,

                email: data.custrecord126,

                phone: data.custrecord_bits_std_phone,
            }

            mapcontext.write({
                key: course,
                value: JSON.stringify(obj),
            });
        }

        function reduce(reducecontext) {

            log.debug("Reduce Key", reducecontext.key);
            log.debug("Reduce Values", reducecontext.values);

            reducecontext.values.forEach(value => {

                log.debug("Reduce Value", value);

                reducecontext.write({
                    key: reducecontext.key,
                    value: value
                });

            });

        }
    

        function summarize(summaryContext) {

        let csvContent = 'Student Name,Previous College,Age,Gender,Email,Phone\n';

        summaryContext.output.iterator().each(function (key, value) {

            const line = JSON.parse(value);

            csvContent += `"${line.student_name}","${line.previous_clg_name}","${line.age}","${line.gender}","${line.email || ''}","${line.phone || ''}"\n`;

            return true;
        });

        const csvFile = file.create({
            name: 'Not_Email_Student_Data.csv',
            fileType: file.Type.CSV,
            contents: csvContent,
            folder: 135
        });

        const fileId = csvFile.save();

        log.audit('CSV Created', fileId);
    }


        return {
    getInputData: getInputData,
    map: map,
    reduce: reduce,
    summarize: summarize
}
    });
