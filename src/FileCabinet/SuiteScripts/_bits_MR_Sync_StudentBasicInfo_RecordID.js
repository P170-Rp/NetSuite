/**
 *
 * _bits_MR_Sync_StudentBasicInfo_RecordID.js
 *
 * Purpose:
 *   Har existing "Student Registration Form" (SRF) record ko process karta hai.
 *   Uske Student Name + Previous College Name se matching "Student Basic Info" (SBI)
 *   record dhundta hai, aur match milne par SBI ki Internal ID ko SRF ke
 *   "RECORDID" (custrecord_srf_recordid) field me set kar deta hai.
 *
 * @NApiVersion 2.1
 * @NScriptType MapReduceScript
 */
define(['N/search', 'N/record', 'N/log'], function (search, record, log) {

    // ============================================================
    //  CONFIGURATION - apne account ke actual internal IDs daalein
    // ============================================================

    // Custom record type IDs (Customization > Lists, Records & Fields > Record Types)
    var STUDENT_REG_FORM_RECTYPE  = 'customrecord_bits_student_registration_f'; // <-- update
    var STUDENT_BASIC_INFO_RECTYPE = 'customrecord_bits_student_basic_in';       // <-- update

    // Student Registration Form (target) ke field IDs
    var FLD_SRF_STUDENT_NAME = 'custrecord_bits_student_name';     // <-- update
    var FLD_SRF_PREV_COLLEGE = 'custrecord_bits_previous_college_name'; // <-- update
    var FLD_SRF_RECORDID     = 'custrecord_bits_recordid';         // <-- update (ye wahi "RECORDID" column hai jo screenshot me dikh raha hai)

    // Student Basic Info (source) ke field IDs
    var FLD_SBI_STUDENT_NAME = 'custrecord_bits_sbif_student_name';     // <-- update
    var FLD_SBI_PREV_COLLEGE = 'custrecord_bits_sb_previous_college_name'; // <-- update

    // ============================================================
    //  GET INPUT DATA - saare SRF records jinka RECORDID abhi empty hai
    // ============================================================
    function getInputData() {
        return search.create({
            type: STUDENT_REG_FORM_RECTYPE,
            filters: [
                [FLD_SRF_RECORDID, search.Operator.ISEMPTY, '']
            ],
            columns: [
                'internalid',
                FLD_SRF_STUDENT_NAME,
                FLD_SRF_PREV_COLLEGE
            ]
        });
    }

    // ============================================================
    //  MAP - har SRF record ke liye matching SBI record dhundo
    // ============================================================
    function map(context) {
        var result = JSON.parse(context.value);
        var srfInternalId = result.id;
        var studentName = result.values[FLD_SRF_STUDENT_NAME];
        var prevCollege = result.values[FLD_SRF_PREV_COLLEGE];

        if (!studentName || !prevCollege) {
            log.debug('Skipped (missing data)', 'SRF Internal ID: ' + srfInternalId);
            return;
        }

        var sbiSearch = search.create({
            type: STUDENT_BASIC_INFO_RECTYPE,
            filters: [
                [FLD_SBI_STUDENT_NAME, search.Operator.IS, studentName],
                'AND',
                [FLD_SBI_PREV_COLLEGE, search.Operator.IS, prevCollege]
            ],
            columns: ['internalid']
        });

        var matches = sbiSearch.run().getRange({ start: 0, end: 1 });

        if (matches && matches.length > 0) {
            var sbiInternalId = matches[0].getValue('internalid');
            context.write({
                key: srfInternalId,
                value: sbiInternalId
            });
        } else {
            log.debug('No match found', 'SRF ' + srfInternalId + ' -> ' + studentName + ' / ' + prevCollege);
        }
    }

    // ============================================================
    //  REDUCE - RECORDID field update karo
    // ============================================================
    function reduce(context) {
        var srfInternalId = context.key;
        var sbiInternalId = context.values[0];

        try {
            var values = {};
            values[FLD_SRF_RECORDID] = sbiInternalId;

            record.submitFields({
                type: STUDENT_REG_FORM_RECTYPE,
                id: srfInternalId,
                values: values,
                options: {
                    enablesourcing: false,
                    ignoreMandatoryFields: true
                }
            });

            log.audit('RecordID Updated', 'SRF Internal ID ' + srfInternalId + ' -> RecordID set to ' + sbiInternalId);
        } catch (e) {
            log.error('Error updating SRF ' + srfInternalId, e.message);
        }
    }

    // ============================================================
    //  SUMMARIZE - errors aur stats log karo
    // ============================================================
    function summarize(summary) {
        log.audit('Script Summary', 'Usage: ' + summary.usage + ' | Concurrency: ' + summary.concurrency + ' | Yields: ' + summary.yields);

        summary.mapSummary.errors.iterator().each(function (key, error) {
            log.error('Map Stage Error - Key: ' + key, error);
            return true;
        });

        summary.reduceSummary.errors.iterator().each(function (key, error) {
            log.error('Reduce Stage Error - Key: ' + key, error);
            return true;
        });
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
