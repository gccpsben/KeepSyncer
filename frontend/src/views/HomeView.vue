<script setup lang="ts">
import { useMainStore } from '@/stores/main';
import { ref } from 'vue';
import { Html5Qrcode } from "html5-qrcode";
</script>

<script lang="ts">
import { FileMessageEntry, MessageEntry, MessageType, StringMessageEntry } from '../shared/test';

export default 
{
    data()
    {
        var data = 
        {
            store: useMainStore(),
            isLinkDeviceModalActive: true
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
        }
    }
}

</script>

<template>
    <div id="reader" width="600px"></div>
    <div id="topDiv">
        <div style="color:white; overflow:scroll; overflow-x: hidden; display:flexbox;">
            <div v-for="message in store.messages" class="messageRow" :class="{'fromSelf': message.senderID == store.socketID}">
                <div>
                    <div v-if="message.type == MessageType.string">{{ (message as StringMessageEntry).message }}</div>

                    <gridShortcut class="fileContainer" columns="auto 50px" rows="1fr" 
                    v-if="message.type == MessageType.file">
                        <div class="fullSize middleLeft">
                            <div>{{ (message as FileMessageEntry).fileName }}</div>
                            <div class="fileSize">{{ (message as FileMessageEntry).fileSize }} bytes</div>
                        </div>
                        <a :href="(message as FileMessageEntry).downloadLink" target="_blank">
                            <span class="material-symbols-outlined noHighlight">download</span>
                        </a>
                    </gridShortcut>

                    <div class="sender">at {{ new Date(message.time).toLocaleTimeString() }}</div>
                </div>
            </div>
        </div>
        <gridShortcut columns="50px auto 50px" rows="1fr" class="fullSize borderBox" style="padding:0px;">
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

#topDiv
{
    background: @backgroundDark;
    .fullSize;
    display:grid;
    grid-template-columns: 1fr;
    grid-template-rows: auto 50px;
    padding:50px; 
    .borderBox;

    input[type=text]
    {
        background:@background; 
        border:0px; color:white;
        padding:20px 15px 20px 15px; outline:none; appearance: none;
    }

    button
    {
        .fullSize; .center; background:@surface;
        border-radius: 5px; color:@foreground;
        border:0px; text-decoration: none;

        &:hover { background: @surfaceHigh; cursor:pointer; }
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
            max-width:40%; word-wrap: break-word;

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
</style>
