/**
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/record', 'N/search', 'N/query', 'N/runtime', 'N/log', 'N/file'],
    (record, search, query, runtime, log, file) => {

        function getInputData() {

            const studentSql = `
                SELECT
                    id,
                    custrecord125 AS name,
                    custrecord126 AS mark1,
                    custrecord127 AS mark2,
                    custrecord128 AS mark3,
                    custrecord136 AS total,
                    custrecord129 AS per,
                    custrecord_bits_grade1 AS grade
                FROM customrecord_bits_student_register
            `;

            return query.runSuiteQL({
                query: studentSql
            }).asMappedResults();
        }

        function map(mapContext) {

            const data = JSON.parse(mapContext.value);

            mapContext.write({
                key: data.id,
                value: JSON.stringify({
                    name: data.name,
                    mark1: data.mark1,
                    mark2: data.mark2,
                    mark3: data.mark3
                })
            });
        }

        function reduce(reduceContext) {

            const studentId = reduceContext.key;
            let obj = null;
            let total = 0;

            reduceContext.values.forEach(function (value) {

                obj = JSON.parse(value);

                total =
                    parseFloat(obj.mark1 || 0) +
                    parseFloat(obj.mark2 || 0) +
                    parseFloat(obj.mark3 || 0);

            });

            const percentage = parseFloat((total / 3).toFixed(2));

            let grade = "";

            switch (true) {

                case percentage >= 90:
                    grade = "A";
                    break;

                case percentage >= 80:
                    grade = "B";
                    break;

                case percentage >= 60:
                    grade = "C";
                    break;

                case percentage >= 50:
                    grade = "D";
                    break;

                case percentage >= 40:
                    grade = "E+";
                    break;

                case percentage > 35:
                    grade = "E";
                    break;

                case percentage === 35:
                    grade = "Pass";
                    break;

                default:
                    grade = "Fail";
            }

            try {

                const rec = record.load({
                    type: 'customrecord_bits_student_register',
                    id: studentId,
                    isDynamic: false
                });

                rec.setValue({
                    fieldId: 'custrecord136',
                    value: total
                });

                rec.setValue({
                    fieldId: 'custrecord129',
                    value: percentage
                });

                rec.setValue({
                    fieldId: 'custrecord_bits_grade1',
                    value: grade
                });

                const recId = rec.save();

                log.debug("Record Updated", recId);

            } catch (e) {

                log.error("Error", e);

            }

            reduceContext.write({
                key: studentId,
                value: {
                    name: obj.name,
                    mark1: obj.mark1,
                    mark2: obj.mark2,
                    mark3: obj.mark3,
                    total: total,
                    percentage: percentage,
                    grade: grade
                }
            });

        }

        function summarize(summaryContext) {

            let csvContent = "ID,Student Name,Mark1,Mark2,Mark3,Total,Percentage,Grade\n";

            summaryContext.output.iterator().each(function (key, value) {

                const line = JSON.parse(value);

                csvContent += `${key},${line.name},${line.mark1},${line.mark2},${line.mark3},${line.total},${line.percentage},${line.grade}\n`;

                return true;
            });

            const csvFile = file.create({
                name: "Student Result.csv",
                fileType: file.Type.CSV,
                contents: csvContent,
                folder: 138
            });

            try {

                const fileId = csvFile.save();

                log.debug("File Saved", fileId);

            } catch (e) {

                log.error("File Save Error", e);

            }
        }

        return {
            getInputData,
            map,
            reduce,
            summarize
        };

    });