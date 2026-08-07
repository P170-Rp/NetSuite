/** *
 * @NApiVersion 2.1
 * @NScriptType UserEventScript
 */
define(['N/record', 'N/log', 'N/error', 'N/redirect', 'N/runtime'],
    function (record, log, error, redirect, runtime) {

        /**
         * Defines the function definition that is executed after record is submitted.
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {Record} scriptContext.oldRecord - Old record
         * @param {string} scriptContext.type - Trigger type; use values from the context.UserEventType enum
         * @since 2015.2
         */

    var STUDENT_BASIC_INFO_RECTYPE  = 'customrecord_bits_student_basic_in';
    var STUDENT_REG_FORM_RECTYPE    = 'customrecord_bits_student_registration_f';

    // Parent (Student Basic Info) field IDs
    var FLD_SBI_STUDENT_NAME = 'custrecord_bits_sbif_student_name';
    var FLD_SBI_PREV_COLLEGE = 'custrecord_bits_sb_previous_college_name';

    // Child (Student Registration Form) field IDs
    var FLD_SRF_STUDENT_NAME = 'custrecord_bits_student_name';
    var FLD_SRF_PREV_COLLEGE = 'custrecord_bits_previous_college_name';
    var FLD_SRF_RECORDID     = 'custrecord_bits_recordid';


    function afterSubmit(context) {

        if (context.type !== context.UserEventType.CREATE) {
            return;
        }

        var parentRecord = context.newRecord;
        var parentInternalId = parentRecord.id;

        try {
            var studentName, prevCollege;

            try {
                studentName = parentRecord.getValue({ fieldId: FLD_SBI_STUDENT_NAME });
                prevCollege = parentRecord.getValue({ fieldId: FLD_SBI_PREV_COLLEGE });
            } catch (fieldErr) {
                log.error({
                    title: 'Field Read Error - Parent Record ' + parentInternalId,
                    details: fieldErr.message || fieldErr
                });
                throw error.create({
                    name: 'PARENT_FIELD_READ_FAILED',
                    message: 'Parent record se Student Name / Previous College nahi padh paye: ' + fieldErr.message
                });
            }

            if (!studentName || !prevCollege) {
                log.audit({
                    title: 'Skipped Child Creation',
                    details: 'Parent ' + parentInternalId + ' me Student Name ya Previous College missing hai.'
                });
                return;
            }

            var childRecord;
            try {
                childRecord = record.create({
                    type: STUDENT_REG_FORM_RECTYPE,
                    isDynamic: true
                });

                childRecord.setValue({ fieldId: FLD_SRF_STUDENT_NAME, value: studentName });
                childRecord.setValue({ fieldId: FLD_SRF_PREV_COLLEGE, value: prevCollege });
                childRecord.setValue({ fieldId: FLD_SRF_RECORDID, value: parentInternalId });

            } catch (buildErr) {
                log.error({
                    title: 'Child Record Build Error - Parent ' + parentInternalId,
                    details: buildErr.message || buildErr
                });
                throw error.create({
                    name: 'CHILD_RECORD_BUILD_FAILED',
                    message: 'Child record object banate waqt error aayi: ' + buildErr.message
                });
            }

            try {
                var childInternalId = childRecord.save({
                    enableSourcing: false,
                    ignoreMandatoryFields: true
                });

                log.audit({
                    title: 'Child Record Created',
                    details: 'Parent Basic Info ID: ' + parentInternalId +
                             ' -> Child Registration Form ID: ' + childInternalId
                });

                try {
                    var execContext = runtime.executionContext;

                    if (execContext === runtime.ContextType.USER_INTERFACE) {
                        redirect.toRecord({
                            type: STUDENT_REG_FORM_RECTYPE,
                            id: childInternalId,
                            isEditMode: true
                        });

                        log.audit({
                            title: 'Redirected to Child Record',
                            details: 'User ko Registration Form ID ' + childInternalId + ' par redirect kiya gaya.'
                        });
                    } else {
                        log.debug({
                            title: 'Redirect Skipped',
                            details: 'Execution context "' + execContext + '" UI nahi hai, isliye redirect skip kiya.'
                        });
                    }
                } catch (redirectErr) {
                    log.error({
                        title: 'Redirect Error - Child ' + childInternalId,
                        details: redirectErr.message || redirectErr
                    });
                }

            } catch (saveErr) {
                log.error({
                    title: 'Child Record Save Error - Parent ' + parentInternalId,
                    details: saveErr.message || saveErr
                });
                throw error.create({
                    name: 'CHILD_RECORD_SAVE_FAILED',
                    message: 'Child record save karte waqt error aayi: ' + saveErr.message
                });
            }

        } catch (mainErr) {
            log.error({
                title: 'FAILED: Auto-create Registration Form for Basic Info ' + parentInternalId,
                details: mainErr.message || mainErr
            });
        }
    }

    return {
        afterSubmit: afterSubmit
    };
});
