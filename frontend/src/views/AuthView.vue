<script setup lang="ts">
import { useMainStore } from '@/stores/main';
import { VueElement } from 'vue';


</script>

<template>
    <div id="topDiv">
        <div>
            <gridShortcut id="authPanel" columns="1fr" rows="auto 1fr">
                <div><h3 style="margin-bottom:15px;">Login</h3></div>
                <div v-if="!store.socketLoggedIn" class="fullSize">
                    <gridShortcut class="fullSize" columns="1fr 1fr" rows="1fr">
                        <gridShortcut id="loginPanel" class="fullSize" columns="1fr" rows="auto 1fr">
                            <h3 class="subheader">Login via username / password pair</h3>
                            <div class="fullSize center">
                                <gridShortcut class="fullWidth" columns="1fr" rows="45px 25px 45px 25px 45px">

                                    <div class="fullSize">
                                        <div class="field fullSize">
                                            <div><span class="material-symbols-outlined noHighlight">person</span></div>
                                            <div class="flex">
                                                <input placeholder="Username" v-model="username">
                                            </div>
                                        </div>
                                    </div>

                                    <div></div>

                                    <div class="field">
                                        <div><span class="material-symbols-outlined smallIcon noHighlight">key</span></div>
                                        <div class="flex">
                                            <input v-model="password"
                                            placeholder="Password" :type="pwVisible ? 'text' : 'password'">
                                        </div>
                                        <div @click="pwVisible = !pwVisible" class="noHighlight">
                                            <span class="material-symbols-outlined smallIcon pwToggle">
                                                {{ pwVisible ? 'visibility_off' : 'visibility' }}
                                            </span>
                                        </div>
                                    </div>

                                    <div></div>

                                    <div id="loginCell">
                                        <button @click="login">Login</button>
                                        <button @click="linkDevice">Link Device</button>
                                    </div>
                                </gridShortcut>
                            </div>
                        </gridShortcut>
                        <gridShortcut id="codePanel" class="fullSize" columns="1fr" rows="auto 1fr">
                            <div class="center"><h3 class="subheader">Link device using code</h3></div>
                            <gridShortcut columns="1fr" rows="1fr auto">
                                <div class="fullSize center">
                                    <div id="qrcodeContainer">
                                        <gridShortcut rows="1fr 5px" columns="1fr" v-if="store.authToken">
                                            <qrcode id="qrcode" :size="200" level="L"
                                            background="transparent" :value="store.authToken" foreground="white"></qrcode>  
                                            <progress max="1" :value="qrCodePercentage"></progress>
                                        </gridShortcut>
                                        <div class="center fullSize" v-else>Loading...</div>
                                    </div>
                                </div>
                            </gridShortcut>
                        </gridShortcut>
                    </gridShortcut>
                </div>
            </gridShortcut>
        </div>
    </div>
</template>

<script lang="ts">
export default 
{
    created()
    {
        // Auto update qrcode expire percentage
        var self = this;
        setInterval(() => 
        {
            if (self == undefined || self.store?.authTokenExpireDate == undefined) { self.qrCodePercentage = 0; }
            else if (self.store?.authTokenCreationDate == undefined) { self.qrCodePercentage = 0; }
            else 
            {
                var msRemaining = self.store.authTokenExpireDate.getTime() - Date.now();
                var totalMsAllowed = self.store.authTokenExpireDate.getTime() - self.store.authTokenCreationDate.getTime();
                var qrCodePercentage = msRemaining < 0 ? 0 : msRemaining / totalMsAllowed;
                self.qrCodePercentage = qrCodePercentage;
                if (qrCodePercentage == 0) self.store.requestQRCode();
            }
        }, 1000);
    },
    data()
    {
        var data = 
        { 
            store: useMainStore(), 
            username: "", 
            password: "",
            pwVisible: false,
            qrCodePercentage: 0
        };
        return data;
    },
    async mounted()
    {
        await this.store.connectSocket();
        this.store.requestQRCode();
    },
    methods:
    {
        async login()
        {
            var success = await this.store.login(this.username, this.password);
            alert(`Login success=${success}`);
            if (success) 
            {
                // Since newly-created httponly cookies will NOT be sent in the current socket, disconnect the current socket
                // and open a new socket, so that the newly received cookies can be sent along with the events.
                this.store.socketClient?.disconnect();
                await this.store.connectSocket();
                setTimeout(() => { this.store.authenticateSocket(); }, 1000);
            }
        },
        async requestCode()
        {
            if (!this.store.socketConnected || this.store.socketClient == undefined) this.store.connectSocket();
            setTimeout(() => { this.store.socketClient!.emit("request-device-token"); }, 200);
        },
        linkDevice()
        {
            var token = prompt("Enter a token:");
            this.store.socketClient!.emit("auth-device-token", { token: token });
        }
    }
}
</script>

<style lang="less" scoped>
@import "@/stylesheets/globalStyle.less";

#topDiv
{
    .fullSize;
    background: @background;
    .center;

    #authPanel
    {
        .size(1000px, 500px);
        background: @surface;
        padding:50px;
        box-sizing: border-box;

        #loginPanel
        {
            .fullSize;
            box-sizing: border-box;
            padding-right:50px;
        }

        #codePanel
        {
            border-left:1px solid @surfaceHigh;
            .fullSize;
            box-sizing: border-box;
            padding-left:50px;
        }

        #qrcode
        {
            border:1px solid white;
            padding:5px;
        }

        #qrcodeContainer
        {
            background: @backgroundDark;
            padding:15px;
        }

        progress { border:0px; background:transparent; appearance: none;}
        progress::-moz-progress-bar { background: @focus; }
        progress::-webkit-progress-value { background: @focus; }
    }

    .field
    {
        display:flex; .bg(@backgroundDark);
        color:white;

        .smallIcon { font-size:20px; }
        .pwToggle { cursor:pointer; }
        & > div:nth-child(1) { aspect-ratio:1/1; height:100%; .center; }
        & > div:nth-child(2) { width:100%; }
        & > div:nth-child(3) { aspect-ratio:1/1; height:100%; .center; }

        input
        {
            .clearInput;
            background:inherit;
            border:0; color:white;
            padding:15px; padding-left:5px; width:100%;
        }
    }

    #loginCell
    {
        .horizonalRight;

        button 
        {
            .horiPadding(15px); border:0;
            .bg(@backgroundDark); cursor:pointer;
            color:white; .clearInput;
        }
    }
}
</style>