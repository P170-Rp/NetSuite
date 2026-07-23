// 🔥 Next Mini Project (Level 4 - Interview Level)
// Ab ek thoda realistic Sales Order Client Script banao:
// ✅ Page load hone par current date aur current user ka welcome message dikhao.
// ✅ Customer select hote hi:
// Memo auto-fill karo.
// Terms automatically set karo.
// Sales Rep empty ho to warning dikhao.
// ✅ Item line me:
// Quantity > 100 allowed nahi.
// Rate ≤ 0 allowed nahi.
// Amount > 10,000 ho to warning dikhao (line commit allow kar sakte ho ya block kar sakte ho).
// ✅ Save se pehle:
// At least 1 item hona chahiye.
// Customer mandatory.
// Memo mandatory.
// Total > 0.
// Confirmation dialog (confirm()) dikhao.
// ✅ Agar save successful ho, N/ui/message se "Sales Order validation passed!" ka confirmation message dikhao (page reload ke baad pageInit() 
// me display karke simulate kar sakte ho, kyunki Client Script me save ke baad ka direct callback nahi hota).
/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define(['N/ui/message', 
        'N/ui/dialog', 
        'N/runtime'
        ], function (message, dialog, runtime) {

        function pageInit(context) {

            const user_name = runtime.getCurrentUser().name;
            const mymsg = message.create({
                type: message.Type.INFORMATION,
                title: 'Welcome',
                message: 'Welcome sir '+user_name +'\nDate:' + new Date()
            })

            mymsg.show({
                duration: 3000
            })
        }

        function saveRecord(context) {
            const cust_name = context.currentRecord.getText({ fieldId: 'entity' })
            if (!cust_name) {
                dialog.alert({
                    title: 'Alert',
                    message: 'Mandotary to select Customer.......!'
                })

                return false;
            }


            const Line_count = context.currentRecord.getLineCount({
                sublistId: 'item',
            })

            if (Line_count <= 0) {
                dialog.alert({
                    title: 'Alert',
                    message: 'Item must be 1 to procced.....!'
                })

                return false;
            }

            const memo_ = context.currentRecord.getText({ fieldId: 'memo' })
            if (!memo_) {
                dialog.alert({
                    title: ' Memo Alert',
                    message: 'Fill the Memo Field..........!'
                })

                return false;
            }
            const total_ = context.currentRecord.getValue({
                fieldId: 'total'
            })
            if (total_ > 0) {
                var native_confirm = confirm('Do you want this Selas Record.....!');
                if (native_confirm) {
                  const  myConfirmation = message.create({
                        type: message.Type.CONFIRMATION,
                        title: 'Confirmation message..!',
                        message: 'Sales Order validation passed............!'
                    })

                    myConfirmation.show({
                        duration: 3000
                    })
                    return true;
                }
                else {
                    dialog.alert({
                        title: 'Total Error',
                        message: 'Total must be greater than 0'
                    })
                    return false;
                }
            }
            return true;
        }


        function fieldChanged(context) {
            if (context.fieldId == 'entity') {

                const cust_name = context.currentRecord.getText({
                    fieldId: 'entity',
                })

                const salesMan = context.currentRecord.getText({
                    fieldId: 'salesrep',
                })

                const term_ = context.currentRecord.getValue({
                    fieldId: 'terms',
                })

                if (!salesMan) {
                    
                    const myWarn = message.create({
                        type: message.Type.WARNING,
                        title: 'Sales Man warning',
                        message: 'Sales Man field is empty....!'
                    })

                    myWarn.show({
                        duration: 3000
                    })

                }

                context.currentRecord.setValue({
                    fieldId: 'memo',
                    value:
                        'Sales Order created for ' +
                        cust_name +
                        ' by ' +
                        salesMan
                })
                if (!term_) {
                    context.currentRecord.setValue({
                        fieldId: 'terms',
                        value: 2
                    })

                    return true;
                }




            }
        }


        function validateLine(context) {
            if (context.sublistId == 'item') {
                const Quantity = context.currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'quantity',
                })

                const Rate = context.currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'rate',
                })

                const Amount = context.currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount'
                })

                if (Quantity > 100) {
                    dialog.alert({
                        title: 'Quantity Alert',
                        message: 'Caon not Quantity more than 100'
                    })

                    return false;
                }

                if (Rate <= 0) {
                    dialog.alert({
                        title: 'Rate Alert',
                        message: 'Chack rate it could not be Zero and less than it.............!'
                    })

                    return false;
                }

                if (Amount > 10000) {
                    const myWarn = message.create({
                        type: message.Type.WARNING,
                        title: 'Amount Warning',
                        message: 'Amount is greter than 10000',
                    })

                    myWarn.show({
                        duration: 3000
                    })
                }
            }

            return true;
        }
        function postSourcing(context) {

        }

        function lineInit(context) {

        }

        function validateDelete(context) {

        }
        function validateField(context) {

        }

        function validateInsert(context) {

        }

        function sublistChanged(context) {

        }

        return {
            pageInit: pageInit,
            saveRecord: saveRecord,
            // validateField: validateField,
            fieldChanged: fieldChanged,
            // postSourcing: postSourcing,
            // lineInit: lineInit,
            // validateDelete: validateDelete,
            // validateInsert: validateInsert,
            validateLine: validateLine,
            // sublistChanged: sublistChanged
        }
    });
