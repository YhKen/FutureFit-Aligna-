import {readPrivate,saveReadBack} from './seeker-records.js';
import {lifeRecord} from './life-skills-core.js';
export const loadLifeRecords=c=>c.recent('life_experiences',200);
export async function saveLifeRecord(c,args){const value=lifeRecord(args);return saveReadBack(c,'life_experiences',value.experienceId,value);}
export async function removeLifeRecord(c,id){const old=await readPrivate(c,'life_experiences',id);if(!old)throw Error('record-unavailable');return saveReadBack(c,'life_experiences',id,{...old,active:false,updatedAt:new Date().toISOString()});}
