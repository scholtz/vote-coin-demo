<template>
  <PublicLayout>
    <h1>{{ $t("faq.title") }}</h1>
    <Accordion :activeIndex="0">
      <AccordionTab :header="$t('faq.q1')">
        <p>
          {{ $t("faq.a1") }}
        </p> </AccordionTab
      ><AccordionTab :header="$t('faq.q2')">
        <p>
          {{ $t("faq.a2") }}
        </p>
      </AccordionTab>
      <AccordionTab :header="$t('faq.q3')">
        <p>{{ $t("faq.a3") }}</p>
      </AccordionTab>

      <AccordionTab :header="$t('faq.q6')">
        <p>
          {{ $t("faq.a6") }}
        </p>
      </AccordionTab>
      <AccordionTab :header="$t('faq.q7')">
        <ol>
          <li>
            {{ $t("faq.a7_1") }}
          </li>
          <li>
            {{ $t("faq.a7_2") }}
          </li>
          <li>
            {{ $t("faq.a7_3") }}
          </li>
        </ol>
      </AccordionTab>
      <AccordionTab :header="$t('faq.q8')">
        <p>
          {{ $t("faq.a8_1") }}
        </p>
        <p>{{ $t("faq.a8_2") }}</p>
        <p>
          {{ $t("faq.a8_3") }}
        </p>
        <p>
          {{ $t("faq.a8_4") }}
        </p>
      </AccordionTab>
    </Accordion>
  </PublicLayout>
</template>

<script>
import PublicLayout from "../layouts/Public.vue";
export default {
  components: {
    PublicLayout,
  },
};
</script>