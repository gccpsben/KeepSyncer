<template>
    <div style="display:grid;" :style="{'grid-template-areas': areas, 'grid-template-columns': columns, 'grid-template-rows': rows}">
        <slot></slot>
    </div>
</template>

<script lang="ts">
export default 
{
    data() 
    {
        return { }
    },
    props: 
    {
        rows: { type: String }, 
        areas: { type: String },
        columns: { type: String }
    }
};
</script>