(function(root,factory){
 const api=factory();if(typeof module==="object"&&module.exports)module.exports=api;root.ExaminationRates=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const EXAMINATION_RATE_DECLINE_THRESHOLD=20,UNIT_PRICE_DECLINE_THRESHOLD=17,PATIENT_VOLUME_TOLERANCE=10;
 const number=value=>{if(value===null||value===undefined||value==="")return null;const result=Number(value);return Number.isFinite(result)&&result>=0?result:null};
 function calculateExaminationRates({patients,bloodTests,imaging}={}){const patientTotal=number(patients),bloodTotal=number(bloodTests),imagingTotal=number(imaging),calculable=patientTotal!==null&&patientTotal>0;return {patients:patientTotal,bloodTests:bloodTotal,imaging:imagingTotal,bloodRate:calculable&&bloodTotal!==null?bloodTotal/patientTotal*100:null,imagingRate:calculable&&imagingTotal!==null?imagingTotal/patientTotal*100:null}}
 function declinePercent(current,normal){return Number.isFinite(current)&&Number.isFinite(normal)&&normal>0?(normal-current)/normal*100:null}
 function isClearlyLower(current,normal,threshold=EXAMINATION_RATE_DECLINE_THRESHOLD){const decline=declinePercent(current,normal);return decline!==null&&decline>=threshold}
 function compareExaminationRates(current,normal,threshold=EXAMINATION_RATE_DECLINE_THRESHOLD){const bloodDecline=declinePercent(current?.bloodRate,normal?.bloodRate),imagingDecline=declinePercent(current?.imagingRate,normal?.imagingRate),sufficient=Number.isFinite(current?.bloodRate)&&Number.isFinite(current?.imagingRate)&&Number.isFinite(normal?.bloodRate)&&Number.isFinite(normal?.imagingRate);return {sufficient,bloodDecline,imagingDecline,bloodLow:isClearlyLower(current?.bloodRate,normal?.bloodRate,threshold),imagingLow:isClearlyLower(current?.imagingRate,normal?.imagingRate,threshold)}}
 function isUnitPriceDeclineWithStablePatients(changes){return Number.isFinite(changes?.patients)&&Math.abs(changes.patients)<=PATIENT_VOLUME_TOLERANCE&&Number.isFinite(changes?.unitPrice)&&changes.unitPrice<=-UNIT_PRICE_DECLINE_THRESHOLD}
 return {EXAMINATION_RATE_DECLINE_THRESHOLD,UNIT_PRICE_DECLINE_THRESHOLD,PATIENT_VOLUME_TOLERANCE,calculateExaminationRates,compareExaminationRates,declinePercent,isClearlyLower,isUnitPriceDeclineWithStablePatients};
});
