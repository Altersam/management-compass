const {defineConfig}=require('@playwright/test');
const base=require('./playwright.config.cjs');
module.exports=defineConfig({...base,testDir:'./tests/a11y',timeout:120000});
