export const DEFAULT_TIME_ZONE='Asia/Kuala_Lumpur';
export const INTERVIEW_TIME_ZONES=['Asia/Kuala_Lumpur','Asia/Singapore','Asia/Tokyo','UTC'];
const offsets={'Asia/Kuala_Lumpur':480,'Asia/Singapore':480,'Asia/Tokyo':540,UTC:0};
export const validTimeZone=value=>INTERVIEW_TIME_ZONES.includes(value);
export const zoneLabel=value=>({'Asia/Kuala_Lumpur':'MYT (UTC+8)','Asia/Singapore':'SGT (UTC+8)','Asia/Tokyo':'JST (UTC+9)',UTC:'UTC'})[value]||value;
export function canonicalInstant(value){if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)||!Number.isFinite(Date.parse(value))||new Date(value).toISOString()!==value)throw Error('invalid-interview-time');return value;}
export function localToIso(value,zone){
 if(!validTimeZone(zone))throw Error('invalid-time-zone');
 const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value||'');if(!m)throw Error('invalid-interview-time');
 const year=+m[1],month=+m[2],day=+m[3],hour=+m[4],minute=+m[5];
 if(year<2000||year>2200||month<1||month>12||day<1||hour>23||minute>59)throw Error('invalid-interview-time');
 const local=new Date(Date.UTC(year,month-1,day,hour,minute));if(local.getUTCMonth()!==month-1||local.getUTCDate()!==day)throw Error('invalid-interview-time');
 return new Date(local.getTime()-offsets[zone]*60000).toISOString();
}
export function localValue(value,zone){if(!value)return '';if(!validTimeZone(zone))throw Error('invalid-time-zone');canonicalInstant(value);return new Date(Date.parse(value)+offsets[zone]*60000).toISOString().slice(0,16);}
