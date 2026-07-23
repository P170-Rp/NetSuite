/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/log', 'N/ui/message'], function(log, message) {

    function beforeLoad(context) {
        log.debug({
            title: 'beforeLoad',
            details: 'BeforeLoade Point are Triggerd Succeesfully...!'
        })
    }

    function beforeSubmit(context) {
        log.debug({
            title: 'beforeSubmit',
            details: 'beforeSubmit Point Are Triggered Succeesfully....!'
        })


    }

    function afterSubmit(context) {
        log.debug({
            title: 'AfterSubmit',
            details: 'AfterSubmit Are Triggered Succeesfully.....!',
        })
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    }
});
