<template>
  <v-container fluid class="d-flex flex-column">
    <h1 class="font-weight-light">Project Migrator Tool</h1>
    <h4>Please select a connection to start with</h4>

    <connection_select
      @change="on_connection_changed"
      :project_string_id="project_string_id"
      :features_filters="features_filters"
      ref="connection_select"
      :hide_if_empty="true">

    </connection_select>
    <v-container class="d-flex justify-center align-center flex-column"
                 v-if="!filted_connection_list">
      <v-icon size="200">mdi-archive</v-icon>
      <v-btn class="mt-6" color="primary"  @click="$router.push('/connection/new')">
        <v-icon>mdi-plus</v-icon>
        Create new Connection
      </v-btn>
    </v-container>
    <v-container v-else >
      or
      <v-btn color="primary" @click="$router.push('/connection/new')">
        <v-icon>mdi-plus</v-icon>
        Create new Connection
      </v-btn>
    </v-container>

    <wizard_navigation
      @next="on_next_button_click"
      :loading_next="loading_steps"
      :disabled_next="loading_steps"
      :back_visible="false"
      @back="$emit('previous_step')"
      :skip_visible="false"
    >
    </wizard_navigation>

  </v-container>
</template>

<script lang="ts">

import connection_select from '../connection/connection_select';

import Vue from "vue";
export default Vue.extend( {
  name: 'project_migrator_connection_step',
  components:{
    connection_select
  },
  props:{
    project_string_id:{
      default: null
    }
  },
  data() {
    return {
      step: 1,
      loading_steps: false,
      connection: null,
      global_progress: 0,
      filted_connection_list: [],
      feature_filters: {'project_migration': true}
    }
  },
  computed: {

  },
  created () {
     this.refresh_connection_list()
  },
  methods: {
    on_next_button_click: function(){
      this.$emit('next_step');
    },
    on_connection_changed: function(conn){
      this.connection = conn;
      this.$emit('connection_changed', conn)
    },
    refresh_connection_list: function(){
      this.filted_connection_list = this.$store.state.connection.connection_list.filter(connection => {
        const filterRes = []
        if (!this.features_filters) {
          this.features_filters = {}
        }
        for (const [key, value] of Object.entries(this.features_filters)) {
          filterRes.push(connection.supported_features[key] === value)
        }
        return filterRes.reduce((a, b) => a && b, true);
      });
    }
}
}

) </script>
