/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 *.
 */
define(['N/ui/serverWidget', 'N/record', 'N/redirect', 'N/search'],

    (serverWidget, record, redirect, search) => {

        const onRequest = (context) => {

            if (context.request.method === 'GET') {
                buildForm(context);
            } else {
                handleSubmit(context);
            }
        }

        const buildForm = (context) => {

            const form = serverWidget.createForm({
                title: 'Employee Registration Form'
            });

            form.addTab({ id: 'custpage_tab_personal', label: 'Personal Information' });
            form.addTab({ id: 'custpage_tab_employment', label: 'Employment Details' });
            form.addTab({ id: 'custpage_tab_address', label: 'Address' });
            form.addTab({ id: 'custpage_tab_documents', label: 'Documents' });
            form.addTab({ id: 'custpage_tab_experience', label: 'Previous Experience' });

            form.addFieldGroup({
                id: 'custpage_grp_basic',
                label: 'Basic Information',
                tab: 'custpage_tab_personal'
            });

            const salutation = form.addField({
                id: 'custpage_salutation',
                label: 'Mr./Ms...',
                type: serverWidget.FieldType.TEXT,
                container: 'custpage_grp_basic'
            })

            salutation.setHelpText({ help: `Enter the employee's salutation, such as Mr. or Ms., here.` })

            const empId = form.addField({
                id: 'custpage_empid',
                type: serverWidget.FieldType.TEXT,
                label: 'Employee ID',
                container: 'custpage_grp_basic'
            });

            empId.updateDisplayType({
                displayType: serverWidget.FieldDisplayType.READONLY
            });

            const firstName = form.addField({
                id: 'custpage_firstname',
                type: serverWidget.FieldType.TEXT,
                label: 'First Name',
                container: 'custpage_grp_basic'
            });
            firstName.isMandatory = true;

            const lastName = form.addField({
                id: 'custpage_lastname',
                type: serverWidget.FieldType.TEXT,
                label: 'Last Name',
                container: 'custpage_grp_basic'
            });
            lastName.isMandatory = true;

            const gender = form.addField({
                id: 'custpage_gender',
                type: serverWidget.FieldType.SELECT,
                label: 'Gender',
                source: 'customlist114',
                container: 'custpage_grp_basic'
            });

            form.addField({
                id: 'custpage_dob',
                type: serverWidget.FieldType.DATE,
                label: 'DOB',
                container: 'custpage_grp_basic'
            });

            const email = form.addField({
                id: 'custpage_email',
                type: serverWidget.FieldType.EMAIL,
                label: 'Email',
                container: 'custpage_grp_basic'
            });

            email.isMandatory = true;
            email.setHelpText({ help: 'Official company email only.' });

            const mobile = form.addField({
                id: 'custpage_mobile',
                type: serverWidget.FieldType.PHONE,
                label: 'Mobile Number',
                container: 'custpage_grp_basic'
            });
            mobile.isMandatory = true;
            mobile.setHelpText({ help: 'Enter 10 digit mobile number.' });

            form.addFieldGroup({
                id: 'custpage_grp_job',
                label: 'Job Information',
                tab: 'custpage_tab_employment'
            });

            const Subsidiary = form.addField({
                id: 'custpage_subsidiary',
                label:'Subsidiary',
                type: serverWidget.FieldType.SELECT,
                source: 'subsidiary',
                container: 'custpage_grp_job'
            }).isMandatory = true;


            const department = form.addField({
                id: 'custpage_department',
                type: serverWidget.FieldType.SELECT,
                label: 'Department',
                source: 'department',
                container: 'custpage_grp_job'
            });
            department.isMandatory = true;

            form.addField({
                id: 'custpage_designation',
                type: serverWidget.FieldType.TEXT,
                label: 'Designation',
                container: 'custpage_grp_job'
            });

            const joiningDate = form.addField({
                id: 'custpage_joiningdate',
                type: serverWidget.FieldType.DATE,
                label: 'Joining Date',
                container: 'custpage_grp_job'
            });
            joiningDate.isMandatory = true;

            form.addField({
                id: 'custpage_manager',
                type: serverWidget.FieldType.SELECT,
                label: 'Manager',
                source: 'employee',
                container: 'custpage_grp_job'
            });

            const empType = form.addField({
                id: 'custpage_employmenttype',
                type: serverWidget.FieldType.SELECT,
                label: 'Employment Type',
                container: 'custpage_grp_job'
            });
            empType.addSelectOption({ value: '', text: '' });
            empType.addSelectOption({ value: 'fulltime', text: 'Full Time' });
            empType.addSelectOption({ value: 'parttime', text: 'Part Time' });
            empType.addSelectOption({ value: 'contract', text: 'Contract' });

            const salary = form.addField({
                id: 'custpage_salary',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Salary',
                container: 'custpage_grp_job'
            });
            salary.isMandatory = true;

            form.addField({
                id: 'custpage_worklocation',
                type: serverWidget.FieldType.SELECT,
                label: 'Work Location',
                source: 'location',
                container: 'custpage_grp_job'
            });


            const internalStatus = form.addField({
                id: 'custpage_internalstatus',
                type: serverWidget.FieldType.TEXT,
                label: 'Employee Internal Status',
                container: 'custpage_grp_job'
            });

            internalStatus.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            internalStatus.defaultValue = 'NEW';

            const regDate = form.addField({
                id: 'custpage_regdate',
                type: serverWidget.FieldType.DATE,
                label: 'Employee Registration Date',
                container: 'custpage_grp_job'
            });

            regDate.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
            regDate.defaultValue = new Date();

            const createdBy = form.addField({
                id: 'custpage_createdby',
                type: serverWidget.FieldType.TEXT,
                label: 'Created By',
                container: 'custpage_grp_job'
            });
            createdBy.updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE });
            createdBy.defaultValue = context.request.parameters.custpage_createdby || 'System';

            form.addFieldGroup({
                id: 'custpage_grp_address',
                label: 'Address Information',
                tab: 'custpage_tab_address'
            });

            const country = form.addField({
                id: 'custpage_country',
                type: serverWidget.FieldType.TEXT,
                label: 'Country',
                container: 'custpage_grp_address'
            });
            country.defaultValue = 'India';

            form.addField({
                id: 'custpage_state',
                type: serverWidget.FieldType.TEXT,
                label: 'State',
                container: 'custpage_grp_address'
            });

            form.addField({
                id: 'custpage_city',
                type: serverWidget.FieldType.TEXT,
                label: 'City',
                container: 'custpage_grp_address'
            });

            form.addField({
                id: 'custpage_addr1',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Address Line 1',
                container: 'custpage_grp_address'
            });

            form.addField({
                id: 'custpage_addr2',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Address Line 2',
                container: 'custpage_grp_address'
            });

            form.addField({
                id: 'custpage_pincode',
                type: serverWidget.FieldType.TEXT,
                label: 'PIN Code',
                container: 'custpage_grp_address'
            });


            form.addFieldGroup({
                id: 'custpage_grp_verify',
                label: 'Verification',
                tab: 'custpage_tab_documents'
            });

            form.addField({
                id: 'custpage_aadhar',
                type: serverWidget.FieldType.TEXT,
                label: 'Aadhar Number',
                container: 'custpage_grp_verify'
            });

            form.addField({
                id: 'custpage_pan',
                type: serverWidget.FieldType.TEXT,
                label: 'PAN Number',
                container: 'custpage_grp_verify'
            });

            form.addField({
                id: 'custpage_passport',
                type: serverWidget.FieldType.TEXT,
                label: 'Passport Number',
                container: 'custpage_grp_verify'
            });

            form.addField({
                id: 'custpage_resumeuploaded',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Resume Uploaded',
                container: 'custpage_grp_verify'
            });

            form.addField({
                id: 'custpage_photouploaded',
                type: serverWidget.FieldType.CHECKBOX,
                label: 'Photo Uploaded',
                container: 'custpage_grp_verify'
            });


            const sublist = form.addSublist({
                id: 'custpage_sublist_experience',
                type: serverWidget.SublistType.INLINEEDITOR,
                label: 'Previous Companies',
                tab: 'custpage_tab_experience'
            });

            sublist.addField({
                id: 'custpage_prev_company',
                type: serverWidget.FieldType.TEXT,
                label: 'Company Name'
            });

            sublist.addField({
                id: 'custpage_prev_designation',
                type: serverWidget.FieldType.TEXT,
                label: 'Designation'
            });

            sublist.addField({
                id: 'custpage_prev_experience',
                type: serverWidget.FieldType.FLOAT,
                label: 'Experience (Years)'
            });

            sublist.addField({
                id: 'custpage_prev_salary',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Salary'
            });

            sublist.addField({
                id: 'custpage_prev_reason',
                type: serverWidget.FieldType.TEXTAREA,
                label: 'Reason for Leaving'
            });

            form.addSubmitButton({ label: 'Register Employee' });
            form.addResetButton({ label: 'Clear Form' });

            context.response.writePage(form);
        }


        const handleSubmit = (context) => {

            const req = context.request;

            const requiredFields = {
                'custpage_empid': 'Employee ID',
                'custpage_firstname': 'First Name',
                'custpage_lastname': 'Last Name',
                'custpage_email': 'Email',
                'custpage_mobile': 'Mobile Number',
                'custpage_department': 'Department',
                'custpage_joiningdate': 'Joining Date',
                'custpage_salary': 'Salary',
                'custpage_subsidiary' :  'Subsidiary'
            };



            let duplicateCheck = search.create({
                type: search.Type.EMPLOYEE,
                filters: [['entityid', 'is', req.parameters.custpage_empid]],
                columns: ['internalid']
            }).run().getRange({ start: 0, end: 1 });

            if (duplicateCheck.length > 0) {
                context.response.write('An employee with this Employee ID already exists.');
                return;
            }


            const empRecord = record.create({ type: record.Type.EMPLOYEE, isDynamic: true });

            const empIdValue = req.parameters.custpage_empid ||
                (req.parameters.custpage_firstname + ' ' + req.parameters.custpage_lastname);

            empRecord.setValue({ fieldId: 'entityid', value: empIdValue });
            empRecord.setValue({ fieldId: 'salutation', value: req.parameters.custpage_salutation });
            empRecord.setValue({ fieldId: 'firstname', value: req.parameters.custpage_firstname });
            empRecord.setValue({ fieldId: 'lastname', value: req.parameters.custpage_lastname });
            empRecord.setValue({ fieldId: 'email', value: req.parameters.custpage_email });
            empRecord.setValue({ fieldId: 'phone', value: req.parameters.custpage_mobile });
            empRecord.setValue({ fieldId: 'subsidiary', value: req.parameters.custpage_subsidiary});
            empRecord.setValue({ fieldId: 'department', value: req.parameters.custpage_department });
            empRecord.setValue({ fieldId: 'title', value: req.parameters.custpage_designation });
            empRecord.setValue({ fieldId: 'hiredate', value: new Date(req.parameters.custpage_joiningdate) });
            empRecord.setValue({ fieldId: 'salary', value: req.parameters.custpage_salary });

            if (req.parameters.custpage_dob) {
                empRecord.setValue({ fieldId: 'birthdate', value: new Date(req.parameters.custpage_dob) });
            }
            if (req.parameters.custpage_manager) {
                empRecord.setValue({ fieldId: 'supervisor', value: req.parameters.custpage_manager });
            }


            const lineCount = req.getLineCount({ group: 'custpage_sublist_experience' });
            for (let i = 0; i < lineCount; i++) {
                const companyName = req.getSublistValue({
                    group: 'custpage_sublist_experience',
                    name: 'custpage_prev_company',
                    line: i
                });
                if (companyName) {

                    const note = companyName + ' | ' +
                        req.getSublistValue({ group: 'custpage_sublist_experience', name: 'custpage_prev_designation', line: i }) + ' | ' +
                        req.getSublistValue({ group: 'custpage_sublist_experience', name: 'custpage_prev_experience', line: i }) + ' yrs';
                    empRecord.setValue({
                        fieldId: 'comments',
                        value: (empRecord.getValue({ fieldId: 'comments' }) || '') + note + '\n'
                    });
                }
            }



            const empRecordId = empRecord.save();

            redirect.toRecord({
                type: record.Type.EMPLOYEE,
                id: empRecordId
            });
        }

        return { onRequest: onRequest };
    });