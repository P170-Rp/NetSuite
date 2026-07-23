/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/redirect', 'N/log', 'N/record', 'N/query'], 
         (serverWidget, redirect, log, record, query) => {

    const onRequest = (context) => {
        
        const recId = context.request.parameters.recId;

        if (context.request.method === 'GET') {

            const form = serverWidget.createForm({
            title: '0.1Student Registration Form'
            });

            // form.clientSciptModulePath = './1.2CS.js';
            
            form.addFieldGroup({
                label: 'Primary Information',
                id: 'Primary_Information'
            })
            
            const Nsql = `
                    select custrecord_bits_sbif_student_name as student_name, 	
                    custrecord_bits_sb_previous_college_name  as p_clg_name
                    from
                    customrecord_bits_student_basic_in
                    where id = ${recId} 
                        `

            const resultdata = query.runSuiteQL({query: Nsql}).asMappedResults();


            const recordidFieled = form.addField({
                 label: 'RecordId',
                 id: 'custpage_recordid',
                 type: serverWidget.FieldType.INTEGER,
                container: 'Primary_Information',
             });
             
             recordidFieled.defaultValue = recId;

             recordidFieled.updateDisplayType({
                 displayType: serverWidget.FieldDisplayType.DISABLED
             });

            form.addField({
                label: 'Student Name',
                id: 'custpage_student_name',
                type: serverWidget.FieldType.TEXT,
                container: 'Primary_Information'
            }).defaultValue = resultdata[0].student_name;

            form.addField({
                label: 'Previous College Name',
                id: 'custpage_previous_college_name',
                type: serverWidget.FieldType.TEXTAREA,
                container: 'Primary_Information'
            }).defaultValue = resultdata[0].p_clg_name;

            form.addField({
                label: 'Age',
                id: 'custpage_age',
                type: serverWidget.FieldType.SELECT,
                source: 'customlist115',
                container: 'Primary_Information'
            });

            form.addField({
                label: 'Gender',
                id: 'custpage_gender',
                type: serverWidget.FieldType.SELECT,
                source: 'customlist114',
                container: 'Primary_Information'
            })

            form.addFieldGroup({
                label: 'Contact Information',
                id: 'custpage_fg_contact'
            });

            form.addField({
                label: 'Email',
                id: 'custpage_email',
                type: serverWidget.FieldType.EMAIL,
                container: 'custpage_fg_contact'
            });

            form.addField({
                label: 'Phone',
                id: 'custpage_phone',
                type: serverWidget.FieldType.PHONE,
                container: 'custpage_fg_contact',
            });

            form.addFieldGroup({
                label: 'Academic Information',
                id: 'custpage_fg_academic',
            });

            form.addField({
                label: 'Course',
                id: 'custpage_course',
                type: serverWidget.FieldType.SELECT,
                source: 'customlist116',
                container: 'custpage_fg_academic',
            });

            form.addSubmitButton({
                label: 'Submit',
            })

            context.response.writePage(form);
        }else{
            
            const p = context.request.parameters;

            const stdName= p.custpage_student_name;
            const previous_clg_name = p.custpage_previous_college_name
            const age = p.custpage_age;
            const gender = p.custpage_gender;
            const email = p.custpage_email;
            const phone = p.custpage_phone;
            const cource = p.custpage_course;


           const stdRec =  record.create({
                type: 'customrecord_bits_student_registration_f',
            });

            stdRec.setValue({ fieldId: 'custrecord_bits_recordid',value: recId });
            
            stdRec.setValue({ fieldId: 'custrecord_bits_student_name',value: stdName});

            stdRec.setValue({ fieldId: 'custrecord_bits_previous_college_name', value: previous_clg_name})

            stdRec.setValue({ fieldId: 'custrecord_bits_std_age', value: age});

            stdRec.setValue({ fieldId: 'custrecord_bits_std_gender', value: gender});

            stdRec.setValue({ fieldId: 'custrecord126', value: email});

            stdRec.setValue({ fieldId: 'custrecord_bits_std_phone', value: phone});

            stdRec.setValue({ fieldId: 'custrecord_bits_std_course', value: cource});

            const internalId = stdRec.save();

            const values = {
                stdName,
                age,
                gender,
                email,
                phone,
                cource
            };
            
            log.debug({
                title: 'Student Registration form values',
                details:values,
            })
            redirect.toRecord({
                type: 'customrecord_bits_student_registration_f',
                id: internalId,
            });
            
            
        }
    }

    return {
        onRequest: onRequest
    }
});
