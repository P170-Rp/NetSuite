/**
 *@NApiVersion 2.1
 *@NScriptType Suitelet
 */
define([
    'N/ui/serverWidget',
    'N/redirect'
],
    (
        serverWidget, redirect
    ) => {
        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {


            const serverRequest = scriptContext.request;
            const serverResponse = scriptContext.response;

            if (scriptContext.request.method === 'GET') {

                var form = serverWidget.createForm({
                    title: 'Purchase Order Form'
                });
                form.clientScriptModulePath = '';
                form.addFieldGroup({
                    id: 'bits_primary_information',
                    label: 'Primary Information'
                });
                var vendorId = form.addField({
                    id: 'bits_vendor_id',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Vendor ID',
                    container: 'bits_primary_information'
                });

                var vendorName = form.addField({
                    id: 'bits_vendor_name',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Vendor Name',
                    container: 'bits_primary_information'
                });

                vendorName.isMandatory = true;



                var location = form.addField({
                    id: 'bits_location',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Location',
                    source: 'location',
                    container: 'bits_primary_information'
                })

                var contactNumber = form.addField({
                    id: 'bits_contact_number',
                    type: serverWidget.FieldType.PHONE,
                    label: 'Contact Number',
                    container: 'bits_primary_information'
                });

                var receiveBy = form.addField({
                    id: 'bits_receive_by',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Receive By',
                    container: 'bits_primary_information'
                });

                var date = form.addField({
                    id: 'bits_date',
                    type: serverWidget.FieldType.DATE,
                    label: 'Date',
                    container: 'bits_primary_information'

                });

                date.isMandatory = true;

                var checkBox = form.addField({
                    id: 'bits_foc_item',
                    type: serverWidget.FieldType.CHECKBOX,
                    label: 'FOC Item',
                    container: 'bits_primary_information'

                });

                var approvalStatus = form.addField({
                    id: 'bits_approval_status',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Approval Status',
                    source: 'Approval Status',
                    container: 'bits_primary_information'
                })

                form.addFieldGroup({
                    id: 'bits_sales_information',
                    label: 'Sales Information'
                });

                var currency = form.addField({
                    id: 'bits_currency',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Currency',
                    source: 'Currency',
                    container: 'bits_sales_information'
                })

                currency.isMandatory = true;

                var Memo = form.addField({
                    id: 'bits_memo',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Memo',
                    container: 'bits_sales_information'
                });

                var totalAmount = form.addField({
                    id: 'bits_total_amount',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Total Amount',
                    container: 'bits_sales_information'
                });

                form.addFieldGroup({
                    id: 'bits_classification',
                    label: 'Classification'
                });

                var department = form.addField({
                    id: 'bits_department',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Department',
                    source: 'Department',
                    container: 'bits_classification'
                })

                var subsidiary = form.addField({
                    id: 'bits_subsidiary',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Subsidiary',
                    source: 'Subsidiary',
                    container: 'bits_classification'
                })

                subsidiary.isMandatory = true;

                var className = form.addField({
                    id: 'bits_class',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Class',
                    container: 'bits_classification'
                })
                // Add sublist
                var sublist = form.addSublist({
                    id: 'bits_sublist',
                    type: serverWidget.SublistType.INLINEEDITOR,
                    label: 'Vendor Info'
                });

                var employee = sublist.addField({
                    id: 'bits_employee',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Employee Name'
                });

                var vendorName = sublist.addField({
                    id: 'bits_sublist_vendor_name',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Vendor Name'
                });

                var subsidiary = sublist.addField({
                    id: 'bits_sublist_subsidiary',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Subsidiary',
                    source: 'Subsidiary',
                });

                var contactNo = sublist.addField({
                    id: 'bits_sublist_contact_number',
                    type: serverWidget.FieldType.PHONE,
                    label: 'Contact Number'
                });

                var subLocation = sublist.addField({
                    id: 'bits_sublist_location',
                    type: serverWidget.FieldType.SELECT,
                    label: 'Location',
                    source: 'Location',
                });



                var subClass = sublist.addField({
                    id: 'bits_sublist_class',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Class',

                });
                sublist.addButton({
                    id: 'bits_list_click',
                    label: 'click',
                    functionName: 'clickNext()',
                });

                form.addButton({
                    id: 'bits_custom_submit',
                    label: 'custom Submit',
                    functionName: `submitForm()`,
                });
                form.addSubmitButton({
                    label: 'Submit'
                });

                scriptContext.response.writePage(form);

            } else {

                const delimiter = /\u0001/;
                const vendorId = scriptContext.request.parameters.bits_vendor_id;
                const vendorName = scriptContext.request.parameters.bits_vendor_name;
                const location = scriptContext.request.parameters.bits_location;
                const contactNumber = scriptContext.request.parameters.bits_contact_number;
                const receivedBy = scriptContext.request.parameters.bits_receive_by;
                const date = scriptContext.request.parameters.bits_date;
                const focItem = scriptContext.request.parameters.bits_foc_item;
                const approvalStatus = scriptContext.request.parameters.bits_approval_status;
                const currency = scriptContext.request.parameters.bits_currency;
                const memo = scriptContext.request.parameters.bits_memo;
                const totalAmount = scriptContext.request.parameters.bits_total_amount;
                const department = scriptContext.request.parameters.bits_department;
                const subsidiary = scriptContext.request.parameters.bits_subsidiary;
                const className = scriptContext.request.parameters.bits_class;


                let scriptParameters = {};
                scriptParameters = {
                    vendorName: vendorName,
                };

                redirect.toSuitelet({
                    scriptId: 'customscript_bits_ss_suitelet',
                    deploymentId: 'customdeploy_bits_ss_suitelet',
                    parameters: scriptParameters,
                });

                scriptContext.response.write(`
                    Purchase Order Information: 
                    Vendor Id: ${vendorId} , 
                    Vendor Name: ${vendorName} , 
                    Vendor Location:${location} ,
                    Contact Number: ${contactNumber} , 
                    Receive By: ${receivedBy} , 
                    Date: ${date} , 
                    FOC Item: ${focItem} , 
                    Approval Status: ${approvalStatus} , 
                    Currency: ${currency},
                    Memo: ${memo} ,
                    Total Amount: ${totalAmount} ,
                    Department: ${department} ,
                    Subsidiary: ${subsidiary} ,
                    Class: ${className} `);
                //scriptContext.response.write(`Sublist Information: ${sublistEmpName} ${sublistVendorName} ${sublistSubsidiary} ${sublistContactNumber} ${sublistlocation} ${sublistClass}`);

            }
        }

        return { onRequest }
    });