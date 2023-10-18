<script setup lang="ts">
import { useMainStore } from '@/stores/main';
import { ref } from 'vue';
import { Html5Qrcode } from "html5-qrcode";
</script>

<script lang="ts">
import { FileMessageEntry, MessageEntry, MessageType, StringMessageEntry } from '../shared/test';

export enum LinkingMode
{
    Camera,
    Images,
    RawToken
}

export default 
{
    data()
    {
        var data = 
        {
            store: useMainStore(),
            isLinkDeviceModalActive: true,
            selectedLinkingMode: LinkingMode.Camera,
            isLinkInputModelActive: false,
            selectedCamera: undefined as {'label':string, 'id':string}|undefined,
            availableCameras: [] as Array<{'label':string, 'id':string}>,
            html5QrCode: undefined as undefined|Html5Qrcode
        };
        return data;
    },
    created()
    {
        if (this.store.socketClient == undefined) this.store.connectSocket();
        setTimeout(async () => 
        {
            this.store.authenticateSocket(); 
            this.store.enableFileUpload();
            await this.refreshMessages();
        }, 500);
    },
    mounted()
    {
        
        // let html5QrcodeScanner = new Html5QrcodeScanner("reader",{ fps: 10, qrbox: {width: 250, height: 250} },false);
        // html5QrcodeScanner.render((decodedText, decodedResult) => 
        // {
        //     alert(decodedText);
        // }, decodingError => 
        // {

        // });
    },
    methods:
    {
        sendMessage()
        {
            var message = (this.$refs.mainInput as any).value;
            if (!message) return;
            if (!this.store.socketLoggedIn || this.store.socketClient == undefined) alert(`Socket is not logged in, cannot send messages.`);
            else 
            {
                this.store.socketClient.emit("message", { message: message });
                (this.$refs.mainInput as any).value = "";
            }
        },
        async refreshMessages()
        {
            var allMessages = await this.axios.get("./api/refreshMessages");
            this.store.messages = allMessages.data;
        },
        switchSelectingLinkingMode(enabled: boolean)
        {
            this.isLinkDeviceModalActive = enabled;
            this.isLinkInputModelActive = false;
        },
        selectLinkingMode(mode: LinkingMode)
        {
            this.isLinkDeviceModalActive = false;
            this.isLinkInputModelActive = true;
            this.selectedLinkingMode = mode;

            if (mode == LinkingMode.Camera)
            {
                // This method will trigger user permissions
                Html5Qrcode.getCameras().then(devices => 
                {
                    if (devices && devices.length) { this.availableCameras = devices; }
                })
                .catch(err => { });
            }
        },
        onQRCodeScanned(decodedText:string)
        {
            try
            {
                // Check if the decoded code is JWT token.
                // this might not be 100% valid, this is just a simple check.
                var isPassed = decodedText.split(".").length == 3;
                if (isPassed) 
                {
                    alert("Sent token");
                    this.store.socketClient!.emit("auth-device-token", { token: decodedText });
                    this.html5QrCode?.stop();
                    this.isLinkDeviceModalActive = false;
                }
                else alert(`Wrong qr code: ${decodedText}`);
            }
            catch(ex)
            {
                alert(ex);
            }
        }
    },
    watch:
    {
        async selectedCamera()
        {
            this.html5QrCode = new Html5Qrcode("reader");
            if (!this.selectedCamera?.id) return;

            var cameraID = this.selectedCamera.id;
            var options = { fps:10 };
            var onDecoded = (decodedText:any, decodedResult:any) => this.onQRCodeScanned(decodedText);
            var onError = (errorMessage:any) => { } ;
            var catcher = (err:any) => {  };
            await this.html5QrCode.start(cameraID, options, onDecoded, onError).catch(catcher);

            // if (!this.html5QrCode) return;
            // // if (this.html5QrCode.isScanning) { await this.html5QrCode.stop(); }
            // if (!this.selectedCamera?.id) return;
            // else
            // {
            //     var cameraID = this.selectedCamera.id;
            //     var options = { fps:10, qrbox: { width: 250, height: 250 } };
            //     var onDecoded = (decodedText:any, decodedResult:any) => this.onQRCodeScanned(decodedText);
            //     var onError = (errorMessage:any) => { alert(errorMessage) } ;
            //     var catcher = (err:any) => { alert(err) };
            //     await this.html5QrCode.start(cameraID, options, onDecoded, onError).catch(catcher);
            // }
        }
    }
}

</script>

<template>

    <div v-show="isLinkInputModelActive" id="cameraLinkingModal">
        <div class="backdrop" @click="switchSelectingLinkingMode(false)"></div>
        <gridShortcut columns="1fr" rows="auto auto auto 1fr">
            <h3 class="bottomMargin">Scan QR Code</h3>
            <h3 class="subheader bottomMargin">Select a camera and start scanning</h3>
            <div style="margin-top:15px;">
                <custom-select style="width:200px; border-radius: 5px;" v-model:currentItem="selectedCamera" :items="availableCameras">
                    <template #itemToText="props">{{ props?.item?.label ?? 'Select a camera...' }}</template>
                </custom-select>
            </div>
            <div :style="{'display': selectedCamera == undefined ? 'none' : ''}" style="aspect-ratio: 1/1; overflow:visible;" class="center fullSize">
                <div id="reader" style="min-width:100%;"></div>
            </div>
        </gridShortcut>
    </div>

    <div v-if="isLinkDeviceModalActive" id="linkDeviceModal">
        <div class="backdrop" @click="switchSelectingLinkingMode(false)"></div>
        <gridShortcut id="linkDeviceModalContent" columns="1fr" rows="auto auto 1fr">
            <h3 class="bottomMargin">Linking Device</h3>
            <h3 class="subheader bottomMargin">Select a method</h3>
            <gridShortcut columns="1fr" rows="50px 50px 50px" class="fullSize" style="gap:15px; margin-top:25px;">
                <div @click="selectLinkingMode(LinkingMode.Camera)" class="field">
                    <div><span class="material-symbols-outlined smallIcon noHighlight">camera</span></div>
                    <div class="fullSize"><h3>Camera</h3></div>
                    <div class="noHighlight"><span class="material-symbols-outlined smallIcon">arrow_right</span></div>
                </div>
                <div @click="selectLinkingMode(LinkingMode.Images)" class="field">
                    <div><span class="material-symbols-outlined smallIcon noHighlight">image</span></div>
                    <div class="fullSize"><h3>Images</h3></div>
                    <div class="noHighlight"><span class="material-symbols-outlined smallIcon">arrow_right</span></div>
                </div>
                <div @click="selectLinkingMode(LinkingMode.RawToken)" class="field">
                    <div><span class="material-symbols-outlined smallIcon noHighlight">regular_expression</span></div>
                    <div class="fullSize"><h3>Raw Token</h3></div>
                    <div class="noHighlight"><span class="material-symbols-outlined smallIcon">arrow_right</span></div>
                </div>
            </gridShortcut>
        </gridShortcut>
    </div>

    <div id="topDiv">
        <div id="messagesContainer">
            <div v-for="message in store.messages" class="messageRow" :class="{'fromSelf': message.senderID == store.socketID}">
                <div>
                    <div v-if="message.type == MessageType.string">{{ (message as StringMessageEntry).message }}</div>

                    <gridShortcut class="fileContainer" columns="auto 50px 50px" rows="1fr" 
                    v-if="message.type == MessageType.file">
                        <div class="fullSize middleLeft">
                            <div>{{ (message as FileMessageEntry).fileName }}</div>
                            <div class="fileSize">{{ (message as FileMessageEntry).fileSize }} bytes</div>
                        </div>
                        <a :href="(message as FileMessageEntry).downloadLink" target="_blank">
                            <span class="material-symbols-outlined noHighlight">download</span>
                        </a>
                        <a :href="(message as FileMessageEntry).viewLink" target="_blank">
                            <span class="material-symbols-outlined noHighlight">open_in_new</span>
                        </a>
                    </gridShortcut>

                    <div class="sender">at {{ new Date(message.time).toLocaleTimeString() }}</div>
                </div>
            </div>
        </div>
        <gridShortcut columns="50px 50px auto 50px" rows="1fr" class="fullSize borderBox" style="padding:0px;">
            <button @click="switchSelectingLinkingMode(true)" class="fullSize tight borderBox">
                <span class="material-symbols-outlined noHighlight">person_add</span>
            </button>
            <button @click="($refs.siofuButton as any).click()" class="fullSize tight borderBox">
                <span class="material-symbols-outlined noHighlight">upload</span>
            </button>
            <input type="text" ref="mainInput" @keyup.enter="sendMessage()"
            class="fullSize tight borderBox" placeholder="Type messages here..."/>
            <button @click="sendMessage()" class="fullSize tight borderBox">
                <span class="material-symbols-outlined noHighlight">send</span>
            </button>
            <input ref="siofuButton" style="display:none;" type="file" id="siofu_input" />
        </gridShortcut>
    </div>
</template>

<style lang="less" scoped>
@import "@/stylesheets/globalStyle.less";

#cameraLinkingModal
{
    .center; .fullSize; position:fixed;
    .borderBox; font-family: @font;

    .backdrop { .fullSize; background: #000000CC; position: absolute; }

    & > div
    {
        z-index:1;
        border-radius: 5px;
        background:@backgroundDark;
        min-width:450px;
        padding:30px; .borderBox;
    }
}

#linkDeviceModal
{
    .center; .fullSize; position:fixed;
    .borderBox; padding:50px;

    .backdrop { .fullSize; background: #000000CC; position: absolute; }
    
    #linkDeviceModalContent
    {
        z-index:1; box-sizing: border-box;
        border-radius: 5px; min-width: 300px; width:50%; max-width:500px;
        background:@backgroundDark;
        padding:30px; .borderBox;

        .field
        {
            display:flex; .bg(@background); cursor:pointer;
            color:white; border-radius: 5px;

            & > div:nth-child(1) { aspect-ratio:1/1; height:100%; .center; }
            & > div:nth-child(2) { width:100%; transition: transform 0.2s ease; }
            & > div:nth-child(3) { aspect-ratio:1/1; height:100%; .center; }
            h3 { .fullSize; .middleLeft; font-size:16px; font-weight: 100; }

            &:hover 
            { 
                background:@surfaceHigh; 
                & > div:nth-child(2) { transform:translateX(5px); }
            }
        }
    }

    & > div
    {
        
    }
}

#topDiv
{
    background: @backgroundDark;
    .fullSize;
    display:grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto 50px;
    padding:0px; 
    .borderBox;

    input[type=text]
    {
        background:@background;
        border:0px; color:white; .borderBox; height:50px;
        padding:20px 15px 20px 15px; outline:none; appearance: none;
    }

    button
    {
        .fullSize; .center; background:@surface;
        border-radius: 5px; color:@foreground;
        border:0px; text-decoration: none; .borderBox;

        &:hover { background: @surfaceHigh; cursor:pointer; }
    }

    #messagesContainer 
    { 
        color:white; overflow:scroll; overflow-x: hidden; display:flexbox; 
        padding:15px;
    }

    .messageRow
    {
        .fullWidth; .borderBox; padding-right:10px;
        margin-bottom:10px;

        &.fromSelf { .middleRight; }
        &:not(.fromSelf) { .middleLeft; }
        & > div 
        {
            background:@background; 
            padding:15px; 
            border-radius:5px;
            font-family: @font;
            max-width:80%; word-wrap: break-word;

            .sender
            {
                color: @foregroundDark;
                margin-top:5px;
                font-family: Consolas;
            }

            .fileSize { color:@foregroundDark; font-family: Consolas; }

            .fileContainer
            {
                padding-right:15px;
                width:100%; height:50px;
                padding-bottom:10px;
                gap:10px;

                & > div { display:grid; grid-template-columns: 1fr; grid-template-rows: auto auto; }

                a
                {
                    .fullSize; .center; background:@surface;
                    border-radius: 5px; color:@foreground;
                    border:0px; text-decoration: none;

                    &:hover { background: @surfaceHigh; cursor:pointer; }
                }
            }
        }
    }
}

@media (max-width:800px)
{
    #topDiv
    {
        transition: all 0.5s ease;
        padding:0px !important; .borderBox !important;
    }
}

</style>
