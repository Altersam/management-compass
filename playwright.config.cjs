const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({testDir:'./tests/browser',timeout:30000,fullyParallel:false,workers:1,use:{baseURL:'http://127.0.0.1:4173',browserName:'chromium',headless:true},webServer:{command:'npm run serve',url:'http://127.0.0.1:4173',reuseExistingServer:!process.env.CI},reporter:'list'});
