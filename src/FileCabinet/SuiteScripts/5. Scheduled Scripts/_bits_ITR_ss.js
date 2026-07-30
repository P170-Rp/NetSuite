/**
 * @NApiVersion 2.1
 * @NScriptType ScheduledScript
 */
define(['N/record', 'N/log', 'N/email', 'N/runtime', 'N/file'],
  (record, log, email, runtime,file) => {
    const execute = (context) => {
      try {
        let csv_file_id = 6039;
        const csv_file = file.load({
          id: csv_file_id
        })
        log.debug("Current User Id:", runtime.getCurrentUser().id);
        email.send({
          author: 3281,
          recipients: 'akshay1.bits@gmail.com',
          subject: 'Test CSV file',
          body: 'email body',
          attachments: [csv_file],
        })
        log.debug("Email Send Successfully with CSV Attachment");
      } catch (e) {
        log.error({ title: 'Email Sending Failed', details: e });
      }
    }
    return {
      execute
    };
  });