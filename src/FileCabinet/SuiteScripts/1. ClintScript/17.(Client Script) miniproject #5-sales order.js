// Mini Project: Smart Sales Order Validator
/**
 *@NApiVersion 2.1
 *@NScriptType ClientScript
 */
define(['N/ui/message',
    'N/runtime',
    'N/ui/dialog'],
    (message, runtime, dialog) => {

        let pageInit = (context) => {
            // Page load hone par welcome message dikhao.
            // Agar record edit mode me open hua hai aur Memo already filled hai, to “Existing draft loaded” message dikhao.

            let name = runtime.getCurrentUser().name;
            message.create({
                type: message.Type.INFORMATION,
                title: 'Welcome',
                message: 'Welcome' + name + ' sir' + new Date()
            }).show({
                duration: 5000
            });


            if (context.mode == 'edit') {
                const memo = context.currentRecord.getText({
                    fieldId: 'memo',
                });

                if (!memo) {

                }
                else {
                    message.create({
                        type: message.Type.INFORMATION,
                        title: 'Existing draft loaded',
                        message: 'Existing draft loaded'
                    }).show({
                        duration: 50000
                    });
                }
            }

        }

        let saveRecord = (context) => {
            // Customer mandatory hai.

            // Memo mandatory hai.

            // Location mandatory hai.

            // At least 2 item lines honi chahiye.

            // Total amount ₹500 se kam nahi hona chahiye.

            // Save se pehle confirmation dialog dikhao.

            // Agar user Cancel kare to record save nahi hona chahiye.

            // Agar saari validation pass ho jaye, to “Sales Order validation passed!” confirmation message dikhao.

            if (!context.currentRecord.getText({ fieldId: 'entity' })) {
                message.create({
                    type: message.Type.WARNING,
                    title: 'Customer is mandotary',
                    message: 'Customer is mandotary'
                }).show({
                    duration: 5000
                })
                return false;
            }

            if (!context.currentRecord.getText({ fieldId: 'memo' })) {
                message.create({
                    type: message.Type.WARNING,
                    title: 'Memo is mandotary',
                    message: 'Memo is mandotary'
                }).show({ duration: 5000 });

                return false;
            }

            const linecount = context.currentRecord.getLineCount({ sublistId: 'item' })
            if (linecount < 2) {
                message.create({
                    type: message.Type.WARNING,
                    title: 'select at list 2 item to place order...!',
                    message: 'select at list 2 item to place order...!'
                }).show({ duration: 5000 });
                return false;
            }

            if (context.currentRecord.getValue({ fieldId: 'total' }) < 500) {
                message.create({
                    type: message.Type.WARNING,
                    title: 'Total Amount must be greater than 500...!',
                    message: 'Total Amount must be greater than 500...!'
                }).show({ duration: 5000 })
                return false;
            }

            const ok = confirm('Please confirm The order..!')
            if (ok) {
                message.create({
                    type: message.Type.CONFIRMATION,
                    title: '“Sales Order validation passed!”',
                    message: '“Sales Order validation passed!”'
                })

                return true;
            }
            else {
                return false;
            }

        }

        let validateField = (context) => {
            // Agar Location field blank chhodkar user bahar nikle to warning dikhao aur field exit prevent karo.

            // Agar Department field blank ho to warning dikhao.

            if (context.fieldId == 'location') {
                if (!context.currentRecord.getText({ fieldId: 'location' })) {
                    message.create({
                        type: message.Type.WARNING,
                        title: 'Location is empty',
                        message: 'Please enter your location sir...!'
                    }).show({
                        duration: 50000
                    });

                    return false;
                }
                return true;
            }


            const dipt = context.currentRecord.getText({
                fieldId: 'department',
            });

            if (!dipt) {
                message.create({
                    type: message.Type.WARNING,
                    title: 'Department not entered....!',
                    message: 'Department not entered....!',
                }).show({
                    duration: 50000
                });

                return false;

            }

            return true;

        }

        let fieldChanged = (context) => {
            // Customer select hote hi Memo auto-fill karo.

            // Sales Rep empty ho to warning message dikhao.

            // Item select karte hi current line me quantity 1 set karo agar blank ho.

            if (context.fieldId == 'entity') {
                const cust = context.currentRecord.getText({ fieldId: 'entity' })
                const username = runtime.getCurrentUser().name;
                context.currentRecord.setValue({
                    fieldId: 'memo',
                    value: 'This order placed by '
                        + username + ' for '
                        + cust
                        + 'at '
                        + new Date()
                });
            }

            const salesRep = context.currentRecord.getText({
                fieldId: 'salesrep',
            })
            if (!salesRep) {
                message.create({
                    type: message.Type.WARNING,
                    title: 'Sales Rep is empty...! ',
                    message: ' Sales Rep is empty...!'
                }).show({
                    duration: 5000
                });
                return false;
            }

            if (context.sublistId == 'items' && context.fieldId == 'item') {
                context.currentRecord.setCurrentSublistValue({
                    sublistId: 'items',
                    fieldId: 'quantity',
                    value: 1,
                });
            }

            return true;

        }

        let postSourcing = (context) => {
            // Customer select hone ke baad Terms field automatically set karo.

            // Item select hone ke baad default description populate karo agar blank ho.


            if (context.fieldId == 'entity') {
                context.currentRecord.setValue({ fieldId: 'terms', value: 3 });
            }

            const username = runtime.getCurrentUser().name;
            const discription = context.currentRecord.getText({ fieldId: 'description' })
            if (!discription) {
                context.currentRecord.setCurrentSublistText({
                    sublistId: 'items',
                    fieldId: 'description',
                    value: 'Hi This item has been selected.... by sales Rep: ' + username + '.'
                })
            }
        }

        let lineInit = (context) => {

            // Jab user item sublist me new line start kare, console me “New item line started” print karo.

            // Information message dikhao ki item details enter karein.

            if (context.sublistId == 'items') {
                console.log('New item line started.');
            }

            message.create({
                type: message.Type.INFORMATION,
                title: 'Welcome',
                message: 'Please Enter The Item Details...!'

            }).show({ duration: 5000 })
        }

        let validateDelete = (context) => {
            // Item line delete karne se pehle confirmation dialog dikhao.

            // Agar user Cancel kare to line delete na hone do.

            const ok = confirm('do you really want to this item....!');
            if (ok) {
                return true;
            }
            else {
                return false;
            }

            return true;
        }

        let validateInsert = (context) => {

            // Nayi item line insert karne par information message dikhao.

            // Agar item line count already 20 hai, to new line insert prevent karo.

            const linecount = context.currentRecord.getLineCount({ sublistId: 'items' });
            if (linecount >= 20) {
                return false;
            }
            else {
                message.create({
                    type: message.Type.INFORMATION,
                    Title: 'Line Inertting',
                    message: 'Your inserting new line',
                }).show({ duration: 5000 });
                return true;
            }

            return true;
        }

        let validateLine = (context) => {
            // Quantity 1 se 100 ke beech honi chahiye.

            // Rate 0 se greater hona chahiye.

            // Description blank nahi honi chahiye.

            // Amount ₹25,000 se jyada ho to warning dikhao, lekin line allow kar sakte ho.

            // Duplicate item add nahi hone dena.

            const linecount = context.currentRecord.getLineCount({ sublistId: 'items' });
            const Quantity = context.currentRecord.getCurrentSublistValue({ sublistId: 'items', fieldId: 'quantity' })
            const rate = context.currentRecord.getCurrentSublistValue({ sublistId: 'items', fieldId: 'rate' })
            const discription = context.currentRecord.getCurrentSublistText({ sublistId: 'items', fieldId: 'description' })
            const Amount = context.currentRecord.getCurrentSublistValue({ sublistId: 'items', fieldId: 'amount' })
            const cueerntItem = context.currentRecord.getCurrentSublistValue({ sublistId: 'items', fieldId: 'item' });


            let items = [];

            for (let i = 0; i < linecount; i++) {
                const item = context.currentRecord.getSublistText({
                    sublistId: 'item',
                    fieldId: 'item',
                    line: i
                })

                items.push(item);
            }

            if (items.includes(cueerntItem)) {
                alert('dublicate item not allowed....!');
                return false;
            }

            if (Quantity >= 1 && Quantity <= 100 && rate > 0 && discription != '') {
                return true;
            }

            if (Amount > 25000) {
                message.create({
                    type: message.Type.WARNING,
                    title: 'Amount Are greater than 25000',
                    message: ''
                }).show({ duration: 5000 });
                return true;
            }



            return true;
        }

        let sublistChanged = (context) => {

            // Item sublist me koi bhi change hone par current line count console me print karo.

            // Agar line count 10 se jyada ho jaye, to warning message dikhao.

            if (context.sublistId == 'item') {
                console.log(context.currentRecord.getLineCount({ sublistId: 'item' }));
            }

            if (context.currentRecord.getLineCount({ sublistId: 'item' }) > 10)
                message.create({
                    type: message.Type.WARNING,
                    title: 'More then 10 items are selected.....!',
                    message: 'More then 10 items are selected.....!'
                }).show({ duration: 5000 });
        }

        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            validateField: validateField,
            fieldChanged: fieldChanged,
            postSourcing: postSourcing,
            lineInit: lineInit,
            validateDelete: validateDelete,
            validateInsert: validateInsert,
            validateLine: validateLine,
            sublistChanged: sublistChanged
        }
    });
