<script setup lang="ts">
import { useMainStore } from '@/stores/main';
import { ref } from 'vue';
import { MessageType } from '@/types';
</script>

<script lang="ts">

export default 
{
    data()
    {
        var data = 
        {
            store: useMainStore()
        };
        return data;
    },
    created()
    {
        if (this.store.socketClient == undefined) this.store.connectSocket();
        setTimeout(() => 
        {
            this.store.authenticateSocket(); 
            this.store.enableFileUpload();
        }, 500);
    },
    methods:
    {
        sendMessage()
        {
            var message = (this.$refs.mainInput as any).value;
            if (!this.store.socketLoggedIn || this.store.socketClient == undefined) alert(`Socket is not logged in, cannot send messages.`);
            else 
            {
                this.store.socketClient.emit("message", { message: message });
                (this.$refs.mainInput as any).value = "";
            }
        }
    }
}

</script>

<template>
    <div id="topDiv">
        <div style="padding:50px; color:white; overflow:scroll; overflow-x: hidden; display:flexbox;">

            <div v-for="message in store.messages" class="messageRow" :class="{'fromSelf': message.senderID == store.socketID}">
                <div>
                    <div v-if="message.messageType == MessageType.string">{{ message.message }}</div>
                    <gridShortcut class="fileContainer" columns="auto 50px" rows="1fr" v-if="message.messageType == MessageType.file">
                        <div class="fullSize middleLeft">
                            <div>{{ message.fileName }}</div>
                            <div class="fileSize">{{ message.fileBytes }} bytes</div>
                        </div>
                        <a :href="message.downloadLink" target="_blank"><span class="material-symbols-outlined noHighlight">download</span></a>
                    </gridShortcut>
                    <div class="sender">from {{ message.senderID }}</div>
                </div>
            </div>

            <!-- <div v-for="message in store.messages" class="fullWidth" style="padding:15px; background:red;"
            :class="{'middleRight': message.senderID == store.socketID}">
                {{ message.message }}
            </div> -->

        </div>
        <gridShortcut columns="auto 50px" rows="1fr" class="fullSize">
            <input type="text" ref="mainInput" class="fullSize tight borderBox"/>
            <button @click="sendMessage()" class="fullSize tight borderBox">Send</button>
            <input type="file" id="siofu_input" />
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

    .messageRow
    {
        .fullWidth;
        margin-bottom:5px;

        &.fromSelf { .middleRight; }
        &:not(.fromSelf) { .middleLeft; }
        & > div 
        {
            background:@background; 
            padding:15px; 
            border-radius:5px;
            font-family: @font;

            .sender
            {
                color: @foregroundDark;
                margin-top:5px;
                font-family: Consolas;
            }

            .fileSize { color:@foregroundDark; font-family: Consolas; }

            .fileContainer
            {
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
