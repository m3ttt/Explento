<script lang="ts" setup>
import { useRouter } from "vue-router";
import { logout } from "../lib/auth";

logout();

const router = useRouter();
router.push("/login");
</script>
