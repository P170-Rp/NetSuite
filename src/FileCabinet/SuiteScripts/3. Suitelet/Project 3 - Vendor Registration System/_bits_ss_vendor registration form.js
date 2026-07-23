/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 *
 * Project 3 - Vendor Registration System
 */
define(['N/ui/serverWidget', 'N/redirect'], function (serverWidget, redirect) {

    function onRequest(context) {

        if (context.request.method === 'GET') {

            var params = context.request.parameters;

            var form = serverWidget.createForm({ title: 'Vendor Registration Portal' });

            if (params.status === 'success') {
                var msg = form.addField({
                    id: 'custpage_msg',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Message'
                });
                msg.defaultValue = '<h3 style="color:green;">✅ Vendor Registered Successfully</h3>';
            }

            form.addTab({ id: 'custpage_tab_vendor', label: 'Vendor Information' });
            form.addTab({ id: 'custpage_tab_contact', label: 'Contact Information' });
            form.addTab({ id: 'custpage_tab_address', label: 'Address Information' });
            form.addTab({ id: 'custpage_tab_bank', label: 'Bank Information' });
            form.addTab({ id: 'custpage_tab_items', label: 'Vendor Items' });

            form.addFieldGroup({ id: 'custpage_grp_primary_vendor', label: 'Primary Vendor Details', tab: 'custpage_tab_vendor' });
            form.addFieldGroup({ id: 'custpage_grp_tax_details', label: 'Tax Details', tab: 'custpage_tab_vendor' });
            form.addFieldGroup({ id: 'custpage_grp_primary_contact', label: 'Primary Contact', tab: 'custpage_tab_contact' });
            form.addFieldGroup({ id: 'custpage_grp_communication', label: 'Communication', tab: 'custpage_tab_contact' });
            form.addFieldGroup({ id: 'custpage_grp_office_address', label: 'Office Address', tab: 'custpage_tab_address' });
            form.addFieldGroup({ id: 'custpage_grp_payment_details', label: 'Payment Details', tab: 'custpage_tab_bank' });

            var vendorName = form.addField({ id: 'custpage_vendor_name', type: serverWidget.FieldType.TEXT, label: 'Vendor Name', container: 'custpage_grp_primary_vendor' });
            vendorName.defaultValue = params.custpage_vendor_name || '';

            var vendorCode = form.addField({ id: 'custpage_vendor_code', type: serverWidget.FieldType.TEXT, label: 'Vendor Code', container: 'custpage_grp_primary_vendor' });
            vendorCode.defaultValue = params.custpage_vendor_code || '';

            var vendorType = form.addField({ id: 'custpage_vendor_type', type: serverWidget.FieldType.SELECT, label: 'Vendor Type', container: 'custpage_grp_primary_vendor' });
            vendorType.addSelectOption({ value: '', text: '' });
            vendorType.addSelectOption({ value: 'raw_material', text: 'Raw Material' });
            vendorType.addSelectOption({ value: 'services', text: 'Services' });
            vendorType.addSelectOption({ value: 'equipment', text: 'Equipment' });

            var gstNo = form.addField({ id: 'custpage_gst_no', type: serverWidget.FieldType.TEXT, label: 'GST Number', container: 'custpage_grp_tax_details' });
            gstNo.defaultValue = params.custpage_gst_no || '';

            var contactPerson = form.addField({ id: 'custpage_contact_person', type: serverWidget.FieldType.TEXT, label: 'Contact Person', container: 'custpage_grp_primary_contact' });
            contactPerson.defaultValue = params.custpage_contact_person || '';

            var email = form.addField({ id: 'custpage_email', type: serverWidget.FieldType.EMAIL, label: 'Email', container: 'custpage_grp_communication' });
            email.defaultValue = params.custpage_email || '';

            var phone = form.addField({ id: 'custpage_phone', type: serverWidget.FieldType.PHONE, label: 'Phone', container: 'custpage_grp_communication' });
            phone.defaultValue = params.custpage_phone || '';

            var mobile = form.addField({ id: 'custpage_mobile', type: serverWidget.FieldType.PHONE, label: 'Mobile', container: 'custpage_grp_communication' });
            mobile.defaultValue = params.custpage_mobile || '';

            var address1 = form.addField({ id: 'custpage_address1', type: serverWidget.FieldType.TEXT, label: 'Address Line 1', container: 'custpage_grp_office_address' });
            address1.defaultValue = params.custpage_address1 || '';

            var address2 = form.addField({ id: 'custpage_address2', type: serverWidget.FieldType.TEXT, label: 'Address Line 2', container: 'custpage_grp_office_address' });
            address2.defaultValue = params.custpage_address2 || '';

            var city = form.addField({ id: 'custpage_city', type: serverWidget.FieldType.TEXT, label: 'City', container: 'custpage_grp_office_address' });
            city.defaultValue = params.custpage_city || '';

            var state = form.addField({ id: 'custpage_state', type: serverWidget.FieldType.TEXT, label: 'State', container: 'custpage_grp_office_address' });
            state.defaultValue = params.custpage_state || '';

            var country = form.addField({ id: 'custpage_country', type: serverWidget.FieldType.TEXT, label: 'Country', container: 'custpage_grp_office_address' });
            country.defaultValue = params.custpage_country || '';

            var pin = form.addField({ id: 'custpage_pin', type: serverWidget.FieldType.INTEGER, label: 'PIN Code', container: 'custpage_grp_office_address' });
            pin.defaultValue = params.custpage_pin || '';

            var bankName = form.addField({ id: 'custpage_bank_name', type: serverWidget.FieldType.TEXT, label: 'Bank Name', container: 'custpage_grp_payment_details' });
            bankName.defaultValue = params.custpage_bank_name || '';

            var accountNumber = form.addField({ id: 'custpage_account_number', type: serverWidget.FieldType.TEXT, label: 'Account Number', container: 'custpage_grp_payment_details' });
            accountNumber.defaultValue = params.custpage_account_number || '';

            var ifsc = form.addField({ id: 'custpage_ifsc', type: serverWidget.FieldType.TEXT, label: 'IFSC Code', container: 'custpage_grp_payment_details' });
            ifsc.defaultValue = params.custpage_ifsc || '';

            var accountHolder = form.addField({ id: 'custpage_account_holder', type: serverWidget.FieldType.TEXT, label: 'Account Holder Name', container: 'custpage_grp_payment_details' });
            accountHolder.defaultValue = params.custpage_account_holder || '';

            var sublist = form.addSublist({
                id: 'custpage_vendor_items',
                type: serverWidget.SublistType.INLINEEDITOR,
                label: 'Vendor Items',
                tab: 'custpage_tab_items'
            });
            sublist.addField({ id: 'custpage_item_name', type: serverWidget.FieldType.SELECT, label: 'Item Name', source: 'item' });
            sublist.addField({ id: 'custpage_item_category', type: serverWidget.FieldType.TEXT, label: 'Category' });
            sublist.addField({ id: 'custpage_item_price', type: serverWidget.FieldType.CURRENCY, label: 'Price' });
            sublist.addField({ id: 'custpage_item_preferred', type: serverWidget.FieldType.CHECKBOX, label: 'Preferred Vendor' });

            var statusField = form.addField({ id: 'custpage_registration_status', type: serverWidget.FieldType.TEXT, label: 'Registration Status' });
            statusField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            statusField.defaultValue = 'NEW';

            if (params.status === 'success') {
                form.addButton({ id: 'custpage_register_another', label: 'Register Another Vendor', functionName: 'window.location.reload()' });
            } else {
                form.addSubmitButton({ label: 'Register Vendor' });
                form.addButton({ id: 'custpage_cancel', label: 'Cancel', functionName: 'history.back()' });
            }

            context.response.writePage(form);

        } else {

            var req = context.request.parameters;

            var vendorNameVal = req.custpage_vendor_name;
            var gstNoVal = req.custpage_gst_no;
            var phoneVal = req.custpage_phone;
            var emailVal = req.custpage_email;
            var accountNumberVal = req.custpage_account_number;

            var errors = [];

            if (!vendorNameVal) {
                errors.push('Vendor Name cannot be empty.');
            }
            if (!gstNoVal || gstNoVal.length !== 15) {
                errors.push('GST Number must be 15 characters.');
            }
            if (!phoneVal || phoneVal.length !== 10) {
                errors.push('Phone Number should be 10 digits.');
            }
            if (!emailVal) {
                errors.push('Email should not be empty.');
            }
            if (!accountNumberVal) {
                errors.push('Bank Account cannot be empty.');
            }

            if (errors.length > 0) {
                context.response.write('<h3>Please fix the following errors:</h3><ul>');
                errors.forEach(function (e) {
                    context.response.write('<li>' + e + '</li>');
                });
                context.response.write('</ul><a href="javascript:history.back()">Go Back</a>');
                return;
            }

            var values = {
                custpage_vendor_name: req.custpage_vendor_name,
                custpage_vendor_code: req.custpage_vendor_code,
                custpage_vendor_type: req.custpage_vendor_type,
                custpage_gst_no: req.custpage_gst_no,
                custpage_contact_person: req.custpage_contact_person,
                custpage_email: req.custpage_email,
                custpage_phone: req.custpage_phone,
                custpage_mobile: req.custpage_mobile,
                custpage_address1: req.custpage_address1,
                custpage_address2: req.custpage_address2,
                custpage_city: req.custpage_city,
                custpage_state: req.custpage_state,
                custpage_country: req.custpage_country,
                custpage_pin: req.custpage_pin,
                custpage_bank_name: req.custpage_bank_name,
                custpage_account_number: req.custpage_account_number,
                custpage_ifsc: req.custpage_ifsc,
                custpage_account_holder: req.custpage_account_holder,
                status: 'success'
            };

            redirect.toSuitelet({
                scriptId: context.request.parameters.script || 'customscript_vendor_reg_sl',
                deploymentId: context.request.parameters.deploy || 'customdeploy_vendor_reg_sl',
                parameters: values
            });
        }
    }

    return {
        onRequest: onRequest
    };
});