/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 *
 * Script ID:     customscript_bits_sl_bulk_cust
 * Deployment ID: customdeploy_bits_sl_bulk_cust
 *
 * Upload a CSV of customer updates and kick off the Map/Reduce
 * script (customscript_bulk_customer_mr) that applies the updates.
 *
 * IMPORTANT: the CSV must contain a header row with exactly one
 * unique identifier column - internalid, email, or entityid - so
 * the Map/Reduce script knows which customer each row belongs to.
 * Any other columns are treated as fields to update.
 */

define([
    'N/ui/serverWidget',
    'N/file',
    'N/task',
    'N/record'
], (serverWidget, file, task, record) => {

    function onRequest(context) {

        if (context.request.method === 'GET') {
            renderForm(context);
        } else {
            handleSubmit(context);
        }
    }

    function renderForm(context, message) {

        const form = serverWidget.createForm({
            title: 'Bulk Customer Update'
        });

        if (message) {
            form.addPageInitMessage({
                type: serverWidget.MessageType.ERROR,
                title: 'Error',
                message: message
            });
        }

        form.addField({
            id: 'custpage_help',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Instructions'
        }).defaultValue =
            '<p>Upload a CSV with a header row. The CSV <b>must</b> include exactly one ' +
            'unique identifier column so we know which customer to update:</p>' +
            '<ul><li><b>internalid</b></li><li><b>email</b></li><li><b>entityid</b></li></ul>' +
            '<p>Any other columns should be named after the customer field IDs you want to ' +
            'update (e.g. phone, companyname, category, altemail).</p>';

        const csvField = form.addField({
            id: 'custpage_csv',
            type: serverWidget.FieldType.FILE,
            label: 'Upload CSV'
        });
        csvField.isMandatory = true;

        const subField = form.addField({
            id: 'custpage_sub',
            type: serverWidget.FieldType.SELECT,
            label: 'Subsidiary',
            source: record.Type.SUBSIDIARY
        });
        subField.isMandatory = false;
        subField.setHelpText({
            help: 'Optional. If set, only customers in this subsidiary will be matched by email/entityid.'
        });

        form.addSubmitButton({
            label: 'Process'
        });

        context.response.writePage(form);
    }

    function handleSubmit(context) {

        const csvFile = context.request.files.custpage_csv;

        if (!csvFile) {
            renderForm(context, 'Please choose a CSV file to upload.');
            return;
        }

        if (!csvFile.name || csvFile.name.toLowerCase().indexOf('.csv') === -1) {
            renderForm(context, 'The uploaded file must be a .csv file.');
            return;
        }

        let fileId;
        try {
            csvFile.folder = -15; // SuiteScripts folder; change to your preferred file cabinet folder id
            fileId = csvFile.save();
        } catch (e) {
            renderForm(context, 'Could not save the uploaded file: ' + e.message);
            return;
        }

        const subsidiary = context.request.parameters.custpage_sub || '';

        try {
            const mrTask = task.create({
                taskType: task.TaskType.MAP_REDUCE,
                scriptId: 'customscript_bits_mr_customer_builk_data',
                deploymentId: 'customdeploy_bits_mr_customer_builk_data',
                params: {
                    custscript2: fileId,
                    custscript3: subsidiary
                }
            });

            const taskId = mrTask.submit();

            const form = serverWidget.createForm({
                title: 'Bulk Customer Update - Started'
            });

            form.addField({
                id: 'custpage_result',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Result'
            }).defaultValue =
                '<p>Map/Reduce job started successfully.</p>' +
                '<p><b>Task ID:</b> ' + taskId + '</p>' +
                '<p>Check the script execution log (customscript_bulk_customer_mr) for progress and results.</p>';

            context.response.writePage(form);

        } catch (e) {
            renderForm(context, 'Could not start the Map/Reduce job: ' + e.message);
        }
    }

    return {
        onRequest
    };
});