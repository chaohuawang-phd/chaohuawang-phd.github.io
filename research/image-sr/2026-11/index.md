---
layout: page
title: 2026-11月份图像超分辨论文调研
permalink: /research/image-sr/2026-11/
description: 2026年11月完成的检索、论文精读与待核验候选。
nav: false
---

本月首轮检索取得 9 篇正式主会论文的官方记录，其中 HAT 完成正文、图表及补充材料精读，其余 8 篇等待全文核验。检索日期为北京时间 2026 年 11 月 2 日。本轮尚未完成近五年全覆盖。

## 已完成的精读

[HAT CVPR 2023 论文精读]({{ '/research/image-sr/2026-11/hat-cvpr-2023/' | relative_url }})

HAT 在经典 bicubic 设置下通过大窗口、混合通道注意力和重叠跨窗口注意力提高重建结果。同任务预训练带来进一步收益，但其额外数据与训练预算必须与结构贡献分开。精读中保留了正文表 6 与表 7 的配置解释缺口。

## 候选与待精读清单

本轮候选分成两个不能合并排名的方向。HAT、SRFormer、DAT、ATD 和 MambaIRv2 提供经典超分辨与高效上下文建模的入口；SeeSR、TSD-SR、VOSR 和 DreamSR 提供真实世界、生成式与推理成本控制的入口。除 HAT 外，下面只依据官方记录和摘要确定候选资格与阅读主题，没有核验全文实验或当前领先地位。

| 候选                                                                                                                                                                                           | 正式来源  | 下一轮核查重点                                | 当前状态               |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | --------------------------------------------- | ---------------------- |
| [HAT](https://openaccess.thecvf.com/content/CVPR2023/html/Chen_Activating_More_Pixels_in_Image_Super-Resolution_Transformer_CVPR_2023_paper.html)                                              | CVPR 2023 | 方法、预训练与配置解释缺口                    | 本轮完成正文与补充精读 |
| [SRFormer](https://openaccess.thecvf.com/content/ICCV2023/html/Zhou_SRFormer_Permuted_Self-Attention_for_Single_Image_Super-Resolution_ICCV_2023_paper.html)                                   | ICCV 2023 | permuted self-attention的窗口、通道与成本取舍 | 待全文精读             |
| [DAT](https://openaccess.thecvf.com/content/ICCV2023/html/Chen_Dual_Aggregation_Transformer_for_Image_Super-Resolution_ICCV_2023_paper.html)                                                   | ICCV 2023 | 空间/通道聚合能否在匹配预算下改善重建         | 待全文精读             |
| [ATD](https://openaccess.thecvf.com/content/CVPR2024/html/Zhang_Transcending_the_Limit_of_Local_Window_Advanced_Super-Resolution_Transformer_with_CVPR_2024_paper.html)                        | CVPR 2024 | 自适应字典与图像内部先验的独立贡献            | 待全文精读             |
| [SeeSR](https://openaccess.thecvf.com/content/CVPR2024/html/Wu_SeeSR_Towards_Semantics-Aware_Real-World_Image_Super-Resolution_CVPR_2024_paper.html)                                           | CVPR 2024 | 语义提示对保真、幻觉与采样成本的影响          | 待全文精读             |
| [TSD-SR](https://openaccess.thecvf.com/content/CVPR2025/html/Dong_TSD-SR_One-Step_Diffusion_with_Target_Score_Distillation_for_Real-World_Image_CVPR_2025_paper.html)                          | CVPR 2025 | 一步蒸馏的感知质量与速度对照条件              | 待全文精读             |
| [MambaIRv2](https://openaccess.thecvf.com/content/CVPR2025/html/Guo_MambaIRv2_Attentive_State_Space_Restoration_CVPR_2025_paper.html)                                                          | CVPR 2025 | 非因果状态空间与长程交互的控制实验            | 待全文精读             |
| [VOSR](https://openaccess.thecvf.com/content/CVPR2026/html/Wu_VOSR_A_Vision-Only_Generative_Model_for_Image_Super-Resolution_CVPR_2026_paper.html)                                             | CVPR 2026 | 视觉先验、预训练来源与一步SR的数据成本        | 待全文精读             |
| [DreamSR](https://openaccess.thecvf.com/content/CVPR2026/html/Dong_DreamSR_Towards_Ultra-High-Resolution_Image_Super-Resolution_via_a_Receptive-Field_Enhanced_Diffusion_CVPR_2026_paper.html) | CVPR 2026 | 分块推理的局部/全局提示及过度生成控制         | 待全文精读             |

优先补读 2026 年候选，并补查尚未完成的 ECCV、TPAMI、IJCV、NeurIPS、ICML、ICLR 及 2022 年来源。保留所有已发现合格候选，不以本表条数作为配额，也不把“未搜到”写成“该方向没有论文”。

## 本月覆盖边界

本轮已核验上表 9 篇 CVPR/ICCV 官方记录，完成其中 1 篇的全文与补充精读。ECCV、TPAMI、IJCV、NeurIPS、ICML、ICLR 以及 2022 年来源尚待系统补查；没有据此推断这些来源缺少合格工作。

[查看调研范围与比较标准]({{ '/research/image-sr/' | relative_url }}) · [返回栏目首页]({{ '/research/image-sr/' | relative_url }})
